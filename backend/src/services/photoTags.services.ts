import sql from "mssql";

class PhotoTagsService {
  async getExistingTagIds(ids: string[]): Promise<string[]> {
    const request = new sql.Request();

    const paramNames = ids.map((id, i) => {
      request.input(`tid${i}`, sql.UniqueIdentifier, id);
      return `@tid${i}`;
    });

    const result = await request.query(`SELECT id FROM Tags WHERE id IN (${paramNames.join(", ")})`);

    return result.recordset.map((r: any) => r.id as string);
  }

  async replacePhotoTags(photoId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) {
      await new sql.Request()
        .input("photoId", sql.UniqueIdentifier, photoId)
        .query("DELETE FROM PhotoTags WHERE photoId = @photoId");

      return;
    }

    const delRequest = new sql.Request().input("photoId", sql.UniqueIdentifier, photoId);

    const paramNames = tagIds.map((id, i) => {
      delRequest.input(`tid${i}`, sql.UniqueIdentifier, id);
      return `@tid${i}`;
    });
    
    await delRequest.query(`
      DELETE FROM PhotoTags WHERE photoId = @photoId AND tagId NOT IN (${paramNames.join(", ")})
    `);

    for (let i = 0; i < tagIds.length; i++) {
      await new sql.Request()
        .input("photoId", sql.UniqueIdentifier, photoId)
        .input("tagId", sql.UniqueIdentifier, tagIds[i])
        .query(`
          INSERT INTO PhotoTags (photoId, tagId)
          SELECT @photoId, @tagId
          WHERE NOT EXISTS (SELECT 1 FROM PhotoTags WHERE photoId = @photoId AND tagId = @tagId)
        `);
    }
  }

  async getTagsByPhotoId(photoId: string): Promise<string[]> {
    const result = await new sql.Request()
      .input("photoId", sql.UniqueIdentifier, photoId)
      .query(`
        SELECT t.name FROM Tags t
        INNER JOIN PhotoTags pt ON t.id = pt.tagId
        WHERE pt.photoId = @photoId
      `);
    return result.recordset.map((r: any) => r.name);
  }
}

export default new PhotoTagsService();

import sql from "mssql";

type PhotoInput = {
  userId: string;
  categoryId: string;
  userPhotoNumber: number;
  subjectName?: string;
  subjectInsta?: string;
  cameraBody?: string;
  lens?: string;
  place?: string;
  city?: string;
  capturedDate?: string;
  capturedTime?: string;
  caption?: string;
  aperture?: string;
  iso?: string;
  shutterSpeed?: string;
  originalFileName: string;
  storedFileName: string;
  originalUrl: string;
  compressedUrl?: string;
  fileSize?: number;
  mimeType?: string;
};

type MetadataUpdate = {
  categoryId?: string;
  subjectName?: string;
  subjectInsta?: string;
  cameraBody?: string;
  lens?: string;
  place?: string;
  city?: string;
  capturedDate?: string;
  capturedTime?: string;
  caption?: string;
  aperture?: string;
  iso?: string;
  shutterSpeed?: string;
};

type ImageDataUpdate = {
  originalFileName?: string;
  storedFileName?: string;
  originalUrl?: string;
  compressedUrl?: string;
  fileSize?: number;
  mimeType?: string;
};

class PhotoDetailsService {
  async getPhotoById(id: string) {
    const result = await new sql.Request()
      .input("id", sql.UniqueIdentifier, id)
      .query("SELECT * FROM PhotoDetails WHERE id = @id");
    return result.recordset[0] ?? null;
  }

  async createPhoto(data: PhotoInput) {
    const result = await new sql.Request()
      .input("userId", sql.UniqueIdentifier, data.userId)
      .input("categoryId", sql.UniqueIdentifier, data.categoryId)
      .input("userPhotoNumber", sql.Int, data.userPhotoNumber)
      .input("subjectName", sql.NVarChar(255), data.subjectName ?? null)
      .input("subjectInsta", sql.NVarChar(255), data.subjectInsta ?? null)
      .input("cameraBody", sql.NVarChar(255), data.cameraBody ?? null)
      .input("lens", sql.NVarChar(255), data.lens ?? null)
      .input("place", sql.NVarChar(255), data.place ?? null)
      .input("city", sql.NVarChar(255), data.city ?? null)
      .input("capturedDate", sql.Date, data.capturedDate ?? null)
      .input("capturedTime", sql.Time, data.capturedTime ?? null)
      .input("caption", sql.NVarChar(sql.MAX), data.caption ?? null)
      .input("aperture", sql.NVarChar(30), data.aperture ?? null)
      .input("iso", sql.NVarChar(30), data.iso ?? null)
      .input("shutterSpeed", sql.NVarChar(30), data.shutterSpeed ?? null)
      .input("originalFileName", sql.NVarChar(255), data.originalFileName)
      .input("storedFileName", sql.NVarChar(255), data.storedFileName)
      .input("originalUrl", sql.NVarChar(1000), data.originalUrl)
      .input("compressedUrl", sql.NVarChar(1000), data.compressedUrl ?? null)
      .input("fileSize", sql.BigInt, data.fileSize ?? null)
      .input("mimeType", sql.NVarChar(100), data.mimeType ?? null)
      .query(`
        INSERT INTO PhotoDetails (
          userId, categoryId, userPhotoNumber,
          subjectName, subjectInsta, cameraBody, lens, place, city,
          capturedDate, capturedTime, caption, aperture, iso, shutterSpeed,
          originalFileName, storedFileName, originalUrl, compressedUrl, fileSize, mimeType
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId, @categoryId, @userPhotoNumber,
          @subjectName, @subjectInsta, @cameraBody, @lens, @place, @city,
          @capturedDate, @capturedTime, @caption, @aperture, @iso, @shutterSpeed,
          @originalFileName, @storedFileName, @originalUrl, @compressedUrl, @fileSize, @mimeType
        )
      `);
    return result.recordset[0];
  }

  // ponytail: dynamic SET build needed because any subset of fields may be updated
  private async runUpdate(id: string, fieldMap: Record<string, [any, unknown]>, data: object) {
    const keys = Object.keys(data).filter(
      (k) => k in fieldMap && (data as any)[k] !== undefined
    );
    if (keys.length === 0) return null;

    const request = new sql.Request().input("id", sql.UniqueIdentifier, id);
    const setClauses = keys.map((k) => {
      const [type, val] = fieldMap[k];
      request.input(k, type, val);
      return `${k} = @${k}`;
    });
    setClauses.push("updated_at = SYSDATETIME()");

    const result = await request.query(`
      UPDATE PhotoDetails
      SET ${setClauses.join(", ")}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
    return result.recordset[0] ?? null;
  }

  async updatePhotoMetadata(id: string, data: MetadataUpdate) {
    return this.runUpdate(id, {
      categoryId: [sql.UniqueIdentifier, data.categoryId],
      subjectName: [sql.NVarChar(255), data.subjectName],
      subjectInsta: [sql.NVarChar(255), data.subjectInsta],
      cameraBody: [sql.NVarChar(255), data.cameraBody],
      lens: [sql.NVarChar(255), data.lens],
      place: [sql.NVarChar(255), data.place],
      city: [sql.NVarChar(255), data.city],
      capturedDate: [sql.Date, data.capturedDate],
      capturedTime: [sql.Time, data.capturedTime],
      caption: [sql.NVarChar(sql.MAX), data.caption],
      aperture: [sql.NVarChar(30), data.aperture],
      iso: [sql.NVarChar(30), data.iso],
      shutterSpeed: [sql.NVarChar(30), data.shutterSpeed],
    }, data);
  }

  async updatePhotoImageData(id: string, data: ImageDataUpdate) {
    return this.runUpdate(id, {
      originalFileName: [sql.NVarChar(255), data.originalFileName],
      storedFileName: [sql.NVarChar(255), data.storedFileName],
      originalUrl: [sql.NVarChar(1000), data.originalUrl],
      compressedUrl: [sql.NVarChar(1000), data.compressedUrl],
      fileSize: [sql.BigInt, data.fileSize],
      mimeType: [sql.NVarChar(100), data.mimeType],
    }, data);
  }

  async deletePhoto(id: string) {
    const result = await new sql.Request()
      .input("id", sql.UniqueIdentifier, id)
      .query("DELETE FROM PhotoDetails OUTPUT DELETED.id WHERE id = @id");
    return result.recordset[0] ?? null;
  }

  async getPhotoCountByUserId(userId: string): Promise<number> {
    const result = await new sql.Request()
      .input("userId", sql.UniqueIdentifier, userId)
      .query("SELECT COUNT(*) AS total FROM PhotoDetails WHERE userId = @userId");
    return result.recordset[0].total;
  }

  async getPhotosByUserId(userId: string, page: number, limit: number) {
    const result = await new sql.Request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("offset", sql.Int, (page - 1) * limit)
      .input("limit", sql.Int, limit)
      .query(`
        SELECT id, compressedUrl, userPhotoNumber, COUNT(*) OVER() AS total
        FROM PhotoDetails WHERE userId = @userId
        ORDER BY userPhotoNumber
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    const total = result.recordset[0]?.total ?? 0;
    const photos = result.recordset.map(({ total: _, ...photo }: any) => photo);
    return { photos, total };
  }
}

export default new PhotoDetailsService();

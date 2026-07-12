import sql from "mssql";
import { emptyToNull } from "../lib/helper";

type PhotoInput = {
  userId: string;
  // categoryId: string;
  slug: string;
  subjectId?: string;
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
  storedFileName: string;
  originalUrl: string;
  compressedUrl?: string;
  fileSize?: number;
  mimeType?: string;
};

type MetadataUpdate = {
  // categoryId?: string;
  slug?: string;
  subjectId?: string;
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

  async isSlugUnique(userId: string, slug: string, excludeId?: string): Promise<boolean> {
    const result = await new sql.Request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("slug", sql.NVarChar(255), slug)
      .input("excludeId", sql.UniqueIdentifier, excludeId ?? null)
      .query("SELECT 1 AS found FROM PhotoDetails WHERE userId = @userId AND slug = @slug AND (@excludeId IS NULL OR id != @excludeId)");
    return result.recordset.length === 0;
  }

  async createPhoto(data: PhotoInput) {
    const result = await new sql.Request()
      .input("userId", sql.UniqueIdentifier, data.userId)
      // .input("categoryId", sql.UniqueIdentifier, data.categoryId)
      .input("slug", sql.NVarChar(255), data.slug)
      .input("subjectId", sql.UniqueIdentifier, data.subjectId ?? null)
      .input("cameraBody", sql.NVarChar(255), emptyToNull(data.cameraBody))
      .input("lens", sql.NVarChar(255), emptyToNull(data.lens))
      .input("place", sql.NVarChar(255), emptyToNull(data.place))
      .input("city", sql.NVarChar(255), emptyToNull(data.city))
      .input("capturedDate", sql.Date, emptyToNull(data.capturedDate))
      .input("capturedTime", sql.Time, emptyToNull(data.capturedTime))
      .input("caption", sql.NVarChar(sql.MAX), emptyToNull(data.caption))
      .input("aperture", sql.NVarChar(30), emptyToNull(data.aperture))
      .input("iso", sql.NVarChar(30), emptyToNull(data.iso))
      .input("shutterSpeed", sql.NVarChar(30), emptyToNull(data.shutterSpeed))
      .input("storedFileName", sql.NVarChar(255), data.storedFileName)
      .input("originalUrl", sql.NVarChar(1000), data.originalUrl)
      .input("compressedUrl", sql.NVarChar(1000), data.compressedUrl ?? null)
      .input("fileSize", sql.BigInt, data.fileSize ?? null)
      .input("mimeType", sql.NVarChar(100), data.mimeType ?? null).query(`
        INSERT INTO PhotoDetails (
          userId, slug, subjectId,
          cameraBody, lens, place, city,
          capturedDate, capturedTime, caption, aperture, iso, shutterSpeed,
          storedFileName, originalUrl, compressedUrl, fileSize, mimeType
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId, @slug, @subjectId,
          @cameraBody, @lens, @place, @city,
          @capturedDate, @capturedTime, @caption, @aperture, @iso, @shutterSpeed,
          @storedFileName, @originalUrl, @compressedUrl, @fileSize, @mimeType
        )
        -- categoryId: add back to column list and VALUES when re-enabled
      `);
    return result.recordset[0];
  }

  // ponytail: dynamic SET build needed because any subset of fields may be updated
  private async runUpdate(
    id: string,
    fieldMap: Record<string, [any, unknown]>,
    data: object,
  ) {
    const keys = Object.keys(data).filter(
      (k) => k in fieldMap && (data as any)[k] !== undefined,
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
    return this.runUpdate(
      id,
      {
        // categoryId: [sql.UniqueIdentifier, data.categoryId],
        slug: [sql.NVarChar(255), data.slug],
        subjectId: [sql.UniqueIdentifier, data.subjectId ?? null],
        cameraBody: [sql.NVarChar(255), emptyToNull(data.cameraBody)],
        lens: [sql.NVarChar(255), emptyToNull(data.lens)],
        place: [sql.NVarChar(255), emptyToNull(data.place)],
        city: [sql.NVarChar(255), emptyToNull(data.city)],
        capturedDate: [sql.Date, emptyToNull(data.capturedDate)],
        capturedTime: [sql.Time, emptyToNull(data.capturedTime)],
        caption: [sql.NVarChar(sql.MAX), emptyToNull(data.caption)],
        aperture: [sql.NVarChar(30), emptyToNull(data.aperture)],
        iso: [sql.NVarChar(30), emptyToNull(data.iso)],
        shutterSpeed: [sql.NVarChar(30), emptyToNull(data.shutterSpeed)],
      },
      data,
    );
  }

  async updatePhotoImageData(id: string, data: ImageDataUpdate) {
    return this.runUpdate(
      id,
      {
        storedFileName: [sql.NVarChar(255), data.storedFileName],
        originalUrl: [sql.NVarChar(1000), data.originalUrl],
        compressedUrl: [sql.NVarChar(1000), data.compressedUrl],
        fileSize: [sql.BigInt, data.fileSize],
        mimeType: [sql.NVarChar(100), data.mimeType],
      },
      data,
    );
  }

  async deletePhoto(id: string) {
    const result = await new sql.Request()
      .input("id", sql.UniqueIdentifier, id)
      .query("DELETE FROM PhotoDetails OUTPUT DELETED.id WHERE id = @id");
    return result.recordset[0] ?? null;
  }

  async getPhotosByUserId(userId: string, page: number, limit: number) {
    const result = await new sql.Request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("offset", sql.Int, (page - 1) * limit)
      .input("limit", sql.Int, limit).query(`
        SELECT id, compressedUrl, slug, COUNT(*) OVER() AS total
        FROM PhotoDetails WHERE userId = @userId
        ORDER BY created_at ASC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    const total = result.recordset[0]?.total ?? 0;
    const photos = result.recordset.map(({ total: _, ...photo }: any) => photo);
    return { photos, total };
  }

  async getPhotoBySlug(slug: string) {
    const result = await new sql.Request()
      .input("slug", sql.NVarChar(255), slug)
      .query(`
        SELECT pd.*, s.name AS subjectName, s.instaHandle AS subjectInsta
        FROM PhotoDetails pd
        LEFT JOIN Subjects s ON s.id = pd.subjectId
        WHERE pd.slug = @slug
      `);
    return result.recordset[0] ?? null;
  }
}

export default new PhotoDetailsService();

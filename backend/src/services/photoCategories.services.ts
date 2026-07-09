import sql from "mssql";

class PhotoCategoriesService {
  async getCategoryById(id: string): Promise<string | null> {
    const result = await new sql.Request()
      .input("id", sql.UniqueIdentifier, id)
      .query("SELECT name FROM Categories WHERE id = @id");
    return result.recordset[0]?.name ?? null;
  }
}

export default new PhotoCategoriesService();

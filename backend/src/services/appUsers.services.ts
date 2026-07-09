import sql from "mssql";

class AppUsersService {
  async createUser(clerkId: string, email: string, name: string) {
    const result = await new sql.Request()
      .input("clerkId", sql.NVarChar(255), clerkId)
      .input("email", sql.NVarChar(255), email)
      .input("name", sql.NVarChar(255), name)
      .query(`
        INSERT INTO AppUsers (clerkId, email, name)
        OUTPUT INSERTED.*
        VALUES (@clerkId, @email, @name)
      `);
    return result.recordset[0];
  }

  async getUserByClerkId(clerkId: string) {
    const result = await new sql.Request()
      .input("clerkId", sql.NVarChar(255), clerkId)
      .query("SELECT * FROM AppUsers WHERE clerkId = @clerkId");
    return result.recordset[0] ?? null;
  }

  async getUserByEmail(email: string) {
    const result = await new sql.Request()
      .input("email", sql.NVarChar(255), email)
      .query("SELECT * FROM AppUsers WHERE email = @email");
    return result.recordset[0] ?? null;
  }

  async getUserById(id: string) {
    const result = await new sql.Request()
      .input("id", sql.UniqueIdentifier, id)
      .query("SELECT * FROM AppUsers WHERE id = @id");
    return result.recordset[0] ?? null;
  }
}

export default new AppUsersService();

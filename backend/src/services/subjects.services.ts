import sql from "mssql";
import { emptyToNull } from "../lib/helper";

type SubjectInput = {
  name: string;
  instaHandle?: string;
  email?: string;
  phone_number?: string;
  city?: string;
  country?: string;
  portfolio_url?: string;
};

class SubjectsService {
  async getSubjectById(id: string) {
    const result = await new sql.Request()
      .input("id", sql.UniqueIdentifier, id)
      .query("SELECT * FROM Subjects WHERE id = @id");
    return result.recordset[0] ?? null;
  }

  async createSubject(data: SubjectInput) {
    const result = await new sql.Request()
      .input("name", sql.NVarChar(255), data.name)
      .input("instaHandle", sql.NVarChar(255), emptyToNull(data.instaHandle))
      .input("email", sql.NVarChar(255), emptyToNull(data.email))
      .input("phone_number", sql.NVarChar(50), emptyToNull(data.phone_number))
      .input("city", sql.NVarChar(255), emptyToNull(data.city))
      .input("country", sql.NVarChar(255), emptyToNull(data.country))
      .input(
        "portfolio_url",
        sql.NVarChar(1000),
        emptyToNull(data.portfolio_url),
      ).query(`
        INSERT INTO Subjects (name, instaHandle, email, phone_number, city, country, portfolio_url)
        OUTPUT INSERTED.*
        VALUES (@name, @instaHandle, @email, @phone_number, @city, @country, @portfolio_url)
      `);
    return result.recordset[0];
  }

  async updateSubject(id: string, data: Partial<SubjectInput>) {
    const fieldMap: Record<string, [any, unknown]> = {
      name: [sql.NVarChar(255), data.name],
      instaHandle: [sql.NVarChar(255), emptyToNull(data.instaHandle)],
      email: [sql.NVarChar(255), emptyToNull(data.email)],
      phone_number: [sql.NVarChar(50), emptyToNull(data.phone_number)],
      city: [sql.NVarChar(255), emptyToNull(data.city)],
      country: [sql.NVarChar(255), emptyToNull(data.country)],
      portfolio_url: [sql.NVarChar(1000), emptyToNull(data.portfolio_url)],
    };

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
      UPDATE Subjects
      SET ${setClauses.join(", ")}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
    return result.recordset[0] ?? null;
  }

  async findByEmail(email: string, excludeId?: string) {
    const result = await new sql.Request()
      .input("email", sql.NVarChar(255), email)
      .input("excludeId", sql.UniqueIdentifier, excludeId ?? null)
      .query(
        "SELECT id FROM Subjects WHERE email = @email AND (@excludeId IS NULL OR id != @excludeId)",
      );
    return result.recordset[0] ?? null;
  }

  async findByInstaHandle(instaHandle: string, excludeId?: string) {
    const result = await new sql.Request()
      .input("instaHandle", sql.NVarChar(255), instaHandle)
      .input("excludeId", sql.UniqueIdentifier, excludeId ?? null)
      .query(
        "SELECT id FROM Subjects WHERE instaHandle = @instaHandle AND (@excludeId IS NULL OR id != @excludeId)",
      );
    return result.recordset[0] ?? null;
  }

  async getAllSubjects() {
    const result = await new sql.Request().query("SELECT * FROM Subjects ORDER BY name");
    return result.recordset;
  }

  async deleteSubject(id: string) {
    const result = await new sql.Request()
      .input("id", sql.UniqueIdentifier, id)
      .query("DELETE FROM Subjects OUTPUT DELETED.id WHERE id = @id");
    return result.recordset[0] ?? null;
  }
}

export default new SubjectsService();

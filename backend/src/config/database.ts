import postgres from 'postgres'

export class DatabaseConfig {
    private sql: postgres.Sql<{}>

    constructor() {
        const connectionString = process.env.DATABASE_URL || 'postgresql://fuel_user:fuel_password@localhost:5432/fuel_db'
        this.sql = postgres(connectionString, {
            max: 10,
            idle_timeout: 20,
            connect_timeout: 10,
        })
    }

    public getConnection(): postgres.Sql<{}> {
        return this.sql
    }

    public async close(): Promise<void> {
        await this.sql.end()
    }
}

export const db = new DatabaseConfig().getConnection()
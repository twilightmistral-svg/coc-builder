import Dexie, { Table } from "dexie";

export type Account = {
  id: string;
  name: string;
  builders: number;
};

export type TaskStatus = "active" | "done";

export type Task = {
  id: string;
  accountId: string;
  builderNo: number;
  title: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  status: TaskStatus;
};

class AppDB extends Dexie {
  accounts!: Table<Account, string>;
  tasks!: Table<Task, string>;

  constructor() {
    super("coc_builder_db");
    this.version(1).stores({
      accounts: "id, name",
      tasks: "id, accountId, endAt, status, builderNo",
    });
  }
}

export const db = new AppDB();

export async function seedAccounts() {
  const count = await db.accounts.count();
  if (count > 0) return;

  const accounts: Account[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `acc-${String(i + 1).padStart(2, "0")}`,
    name: `垢${i + 1}`,
    builders: 5,
  }));

  await db.accounts.bulkAdd(accounts);
}

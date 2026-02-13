"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { db, seedAccounts, Account, Task } from "../lib/db";

function fmt(dt: Date) {
  return dt.toLocaleString("ja-JP", { hour12: false });
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  async function refresh() {
    await seedAccounts();
    const acc = await db.accounts.toArray();
    const tsk = await db.tasks.where("status").equals("active").toArray();
    setAccounts(acc);
    setTasks(tsk);
  }

  useEffect(() => {
    refresh();
  }, []);

  const nextByAccount = useMemo(() => {
    const map = new Map<string, Task>();
    for (const t of tasks) {
      const cur = map.get(t.accountId);
      if (!cur || new Date(t.endAt).getTime() < new Date(cur.endAt).getTime()) {
        map.set(t.accountId, t);
      }
    }
    return map;
  }, [tasks]);

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">CoC 大工管理</h1>

      <ul className="mt-6 grid grid-cols-2 gap-3">

        {accounts.map((a) => {
          const nt = nextByAccount.get(a.id);
          return (
            <li key={a.id} className="border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-sm text-gray-600">
                    次完了: {nt ? fmt(new Date(nt.endAt)) : "なし"}
                  </div>
                </div>
                <Link
                  className="text-blue-600 underline"
                  href={`/accounts/${a.id}`}
                >
                  開く
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

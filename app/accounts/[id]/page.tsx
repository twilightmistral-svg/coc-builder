"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { db, Account, Task } from "../../../lib/db";



const PRESETS = [
  { label: "6時間", hours: 6 },
  { label: "12時間", hours: 12 },
  { label: "1日", hours: 24 },
  { label: "2日", hours: 48 },
  { label: "3日", hours: 72 },
  { label: "5日", hours: 120 },
  { label: "7日", hours: 168 },
];

function fmt(dt: Date) {
  return dt.toLocaleString("ja-JP", { hour12: false });
}
function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// datetime-local文字列 → Date
function fromLocalInputValue(s: string) {
  const [datePart, timePart] = s.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mi] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mi, 0, 0);
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AccountPage() {
  const params = useParams<{ id: string }>();
  const accountId = params.id;

  const [account, setAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [builderNo, setBuilderNo] = useState(1);
 // 開始時刻（入力用）
const [startLocal, setStartLocal] = useState(toLocalInputValue(new Date()));

// 所要時間（時間・分）
const [durHours, setDurHours] = useState(24);
const [durMinutes, setDurMinutes] = useState(0);


  async function refresh() {
  

  const acc = await db.accounts.get(accountId);
  setAccount(acc ?? null);
  setEditName(acc?.name ?? "");
    const tsk = await db.tasks
      .where("accountId")
      .equals(accountId)
      .and((t) => t.status === "active")
      .toArray();
    setTasks(tsk);
  }
  async function saveName() {
  if (!account) return;

  await db.accounts.update(account.id, {
    name: editName,
  });

  await refresh();
}


  useEffect(() => {
    refresh();
  }, [accountId]);

  const occupied = useMemo(() => {
    const s = new Set<number>();
    for (const t of tasks) s.add(t.builderNo);
    return s;
  }, [tasks]);

  async function addTask() {
  if (!account) return;
  if (!title.trim()) return alert("工事名を入れて");

  if (occupied.has(builderNo)) {
    return alert(`大工${builderNo}は既に工事中`);
  }

  const start = fromLocalInputValue(startLocal);

  const totalMinutes =
    Math.max(0, Number(durHours) * 60 + Number(durMinutes));

  if (totalMinutes === 0) {
    return alert("所要時間を入れて（0分はダメ）");
  }

  const end = new Date(start.getTime() + totalMinutes * 60 * 1000);

  await db.tasks.add({
    id: `tsk-${uid()}`,
    accountId,
    builderNo,
    title: title.trim(),
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    status: "active",
  });

  setStartLocal(toLocalInputValue(new Date()));
  setTitle("");
  await refresh();
}


  async function markDone(taskId: string) {
    await db.tasks.update(taskId, { status: "done" });
    await refresh();
  }

  if (!account) return null;

  return (
    <main className="p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
  <input
    className="border p-2 rounded flex-1"
    value={editName}
    onChange={(e) => setEditName(e.target.value)}
  />
  <button
    className="border px-3 py-2 rounded"
    onClick={saveName}
  >
    保存
  </button>
</div>

        <Link className="underline" href="/">戻る</Link>
      </div>

      <div className="mt-4 space-y-2">
        <input
          className="w-full border p-2 rounded"
          placeholder="工事名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex gap-2">
          <select
            className="border p-2 rounded flex-1"
            value={builderNo}
            onChange={(e) => setBuilderNo(Number(e.target.value))}
          >
            {Array.from({ length: account.builders }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                大工{i + 1}
              </option>
            ))}
          </select>

          <label className="block text-sm text-gray-600">
  開始時刻
</label>

<input
  type="datetime-local"
  className="w-full border p-2 rounded"
  value={startLocal}
  onChange={(e) => setStartLocal(e.target.value)}
/>

<div className="flex gap-2 mt-2">
  <input
    type="number"
    min={0}
    className="border p-2 rounded w-24"
    value={durHours}
    onChange={(e) => setDurHours(Number(e.target.value))}
  />
  <span className="self-center">時間</span>

  <input
    type="number"
    min={0}
    max={59}
    className="border p-2 rounded w-24"
    value={durMinutes}
    onChange={(e) => setDurMinutes(Number(e.target.value))}
  />
  <span className="self-center">分</span>
</div>

        </div>

        <button
          className="w-full bg-black text-white py-2 rounded"
          onClick={addTask}
        >
          追加
        </button>
      </div>

      <ul className="mt-6 space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="border p-3 rounded">
            <div>大工{t.builderNo}：{t.title}</div>
            <div className="text-sm text-gray-600">
              完了: {fmt(new Date(t.endAt))}
            </div>
            <button
              className="mt-2 border px-2 py-1 rounded"
              onClick={() => markDone(t.id)}
            >
              完了
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

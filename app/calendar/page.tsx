"use client";
import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import { db, auth } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { ja },
});

export default function CalendarPage() {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", start: "", end: "", location: "", memo: "" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        start: d.data().start.toDate(),
        end: d.data().end.toDate(),
        resource: { location: d.data().location, memo: d.data().memo },
      })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.start) return;
    await addDoc(collection(db, "events"), {
      title: form.title,
      start: new Date(form.start),
      end: new Date(form.end || form.start),
      location: form.location,
      memo: form.memo,
      createdBy: user?.displayName,
    });
    setForm({ title: "", start: "", end: "", location: "", memo: "" });
    setShowForm(false);
  };

  const handleDelete = async (event) => {
    if (confirm(`「${event.title}」を削除しますか？`)) {
      await deleteDoc(doc(db, "events", event.id));
    }
  };

  if (!user) return <div className="flex items-center justify-center h-screen">ログインしてください</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">イベントカレンダー</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          ＋ イベントを追加
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-medium mb-4">イベントを追加</h2>
            <input className="w-full border rounded-lg p-2 mb-3" placeholder="タイトル" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <label className="text-sm text-gray-500">開始日時</label>
            <input type="datetime-local" className="w-full border rounded-lg p-2 mb-3" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            <label className="text-sm text-gray-500">終了日時</label>
            <input type="datetime-local" className="w-full border rounded-lg p-2 mb-3" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            <input className="w-full border rounded-lg p-2 mb-3" placeholder="場所" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <textarea className="w-full border rounded-lg p-2 mb-4" placeholder="メモ" rows={3} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
            <div className="flex gap-3">
              <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">保存</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={handleDelete}
        messages={{
          next: "次へ",
          previous: "前へ",
          today: "今日",
          month: "月",
          week: "週",
          day: "日",
        }}
      />
    </div>
  );
}
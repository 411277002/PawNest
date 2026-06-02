import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Camera, ImagePlus, Loader2, Plus, Save, Trash2, UploadCloud } from 'lucide-react';
import { petApi, type PetItem } from '../../services/api';

const fallbackPhoto = 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=900&auto=format&fit=crop';

type PetForm = {
  id?: number;
  name: string;
  type: 'dog' | 'cat' | 'other';
  breed: string;
  age: string;
  weight: string;
  gender: string;
  note: string;
  photo_url: string;
};

const emptyPet: PetForm = { name: '', type: 'dog', breed: '', age: '', weight: '', gender: '男生', note: '', photo_url: '' };

function toForm(pet: PetItem): PetForm {
  return { id: pet.id, name: pet.name, type: pet.type, breed: pet.breed || '', age: pet.age ? String(pet.age) : '', weight: pet.weight ? String(pet.weight) : '', gender: pet.gender || '男生', note: pet.note || '', photo_url: pet.photo_url || fallbackPhoto };
}

export function PetProfilePage() {
  const [petList, setPetList] = useState<PetItem[]>([]);
  const [form, setForm] = useState<PetForm>(emptyPet);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadPets = async () => {
    setLoading(true);
    const data = await petApi.listMine();
    setPetList(data.pets);
    if (data.pets.length && !selectedId) {
      setSelectedId(data.pets[0].id);
      setForm(toForm(data.pets[0]));
    }
    setLoading(false);
  };

  useEffect(() => { loadPets().catch(() => setLoading(false)); }, []);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, photo_url: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const selectPet = (pet: PetItem) => {
    setSelectedId(pet.id);
    setForm(toForm(pet));
    setMessage('');
  };

  const newPet = () => {
    setSelectedId(null);
    setForm({ ...emptyPet, photo_url: fallbackPhoto });
    setMessage('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const payload = { ...form, age: form.age ? Number(form.age) : null, weight: form.weight ? Number(form.weight) : null };
      if (form.id) await petApi.update(form.id, payload);
      else await petApi.create(payload);
      setMessage('寵物資料已儲存');
      await loadPets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!form.id) return;
    if (!window.confirm(`確定要刪除 ${form.name} 的資料嗎？`)) return;
    try {
      await petApi.remove(form.id);
      setMessage('寵物資料已刪除');
      setSelectedId(null);
      setForm(emptyPet);
      await loadPets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '刪除失敗');
    }
  };

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-[#e7d6be] bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-black tracking-[0.18em] text-[#b68655]">MY PETS</p><h2 className="mt-1 text-2xl font-black">我的毛孩</h2></div><button type="button" onClick={newPet} className="grid h-12 w-12 place-items-center rounded-full bg-[#b68655] text-white"><Plus className="h-5 w-5" /></button></div>{loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#b68655]" /> : <div className="grid gap-4">{petList.map((pet) => <button key={pet.id} type="button" onClick={() => selectPet(pet)} className={`overflow-hidden rounded-3xl border text-left transition ${selectedId === pet.id ? 'border-[#b68655] bg-[#fffaf3]' : 'border-[#e7d6be] bg-white hover:bg-[#fffaf3]'}`}><div className="flex gap-4 p-4"><img src={pet.photo_url || fallbackPhoto} alt={pet.name} className="h-24 w-24 rounded-3xl object-cover" /><div className="flex-1 py-1"><h3 className="font-black">{pet.name}</h3><p className="text-sm text-[#9c8b78]">{pet.breed || '未填品種'}・{pet.age || '未填年齡'}</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#7b6349]">{pet.note || '尚未填寫照護備註'}</p></div></div></button>)}</div>}</section>
          <section className="rounded-[2rem] border border-[#e7d6be] bg-white p-6 shadow-sm"><div className="mb-6"><p className="text-sm font-black tracking-[0.18em] text-[#b68655]">EDIT</p><h2 className="mt-1 text-2xl font-black">編輯毛孩資料</h2></div><form onSubmit={submit} className="grid gap-5"><div className="rounded-[1.5rem] bg-[#fffaf3] p-5"><div className="relative overflow-hidden rounded-[1.5rem]"><img src={form.photo_url || fallbackPhoto} alt="寵物照片" className="h-64 w-full object-cover" /><label className="absolute bottom-4 right-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[#7b6349]"><UploadCloud className="h-4 w-4" />上傳照片<input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" /></label></div></div><div className="grid gap-5 md:grid-cols-2"><Field label="寵物名稱" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><label className="grid gap-2 text-sm font-black">類型<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PetForm['type'] })} className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none"><option value="dog">狗狗</option><option value="cat">貓咪</option><option value="other">其他</option></select></label></div><div className="grid gap-5 md:grid-cols-2"><Field label="品種" value={form.breed} onChange={(v) => setForm({ ...form, breed: v })} /><label className="grid gap-2 text-sm font-black">性別<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none"><option value="男生">男生</option><option value="女生">女生</option><option value="未結紮男生">未結紮男生</option><option value="未結紮女生">未結紮女生</option><option value="不確定">不確定</option></select></label></div><div className="grid gap-5 md:grid-cols-2"><Field label="年齡" value={form.age} onChange={(v) => setForm({ ...form, age: v })} /><Field label="體重 kg" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} /></div><label className="grid gap-2 text-sm font-black">照護備註<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={5} className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none" /></label>{message && <p className="rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#7b6349]">{message}</p>}<div className="grid gap-3 sm:grid-cols-[1fr_auto]"><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white disabled:opacity-60">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}儲存</button><button type="button" onClick={remove} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e7d6be] bg-white px-6 py-4 font-black text-[#9a5c50]"><Trash2 className="h-5 w-5" />刪除</button></div></form></section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-black">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none" /></label>;
}

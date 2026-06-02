import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, HeartPulse, Loader2, PawPrint, Plus, Save, Trash2 } from 'lucide-react';

type PetForm = {
  id: string;
  name: string;
  breed: string;
  age: string;
  weight: string;
  gender: string;
  note: string;
  avatar: string;
};

const storageKey = 'pawnest_local_pets';

const defaultPets: PetForm[] = [
  { id: 'pet-local-1', name: '小白', breed: '柴犬', age: '3 歲', weight: '10.5 kg', gender: '男生', note: '怕吹風機，需慢慢安撫', avatar: '🐕' },
  { id: 'pet-local-2', name: '咪咪', breed: '貴賓犬', age: '2 歲', weight: '4.8 kg', gender: '女生', note: '皮膚偏敏感，使用低敏洗劑', avatar: '🐩' },
];

const emptyPet: PetForm = { id: '', name: '', breed: '', age: '', weight: '', gender: '男生', note: '', avatar: '🐾' };

function loadLocalPets() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as PetForm[]) : defaultPets;
  } catch {
    return defaultPets;
  }
}

export function PetProfilePage() {
  const [petList, setPetList] = useState<PetForm[]>([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [form, setForm] = useState<PetForm>(emptyPet);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const pets = loadLocalPets();
    setPetList(pets);
    setSelectedPetId(pets[0]?.id || '');
    setForm(pets[0] || { ...emptyPet, id: `pet-${Date.now()}` });
  }, []);

  const selectedPet = petList.find((pet) => pet.id === selectedPetId);

  const persist = (nextList: PetForm[]) => {
    setPetList(nextList);
    localStorage.setItem(storageKey, JSON.stringify(nextList));
  };

  const handleSelectPet = (pet: PetForm) => {
    setSelectedPetId(pet.id);
    setForm(pet);
    setSaved(false);
  };

  const handleNewPet = () => {
    const newPet = { ...emptyPet, id: `pet-${Date.now()}` };
    setSelectedPetId(newPet.id);
    setForm(newPet);
    setSaved(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const exists = petList.some((pet) => pet.id === form.id);
    const nextList = exists ? petList.map((pet) => (pet.id === form.id ? { ...form } : pet)) : [...petList, { ...form }];
    persist(nextList);
    setSelectedPetId(form.id);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const handleDelete = () => {
    if (!selectedPet) return;
    const confirmed = window.confirm(`確定要刪除 ${selectedPet.name || '這筆寵物'} 的資料嗎？`);
    if (!confirmed) return;
    const nextList = petList.filter((pet) => pet.id !== selectedPet.id);
    persist(nextList);
    if (nextList.length > 0) {
      setSelectedPetId(nextList[0].id);
      setForm(nextList[0]);
    } else {
      handleNewPet();
    }
  };

  if (petList.length === 0 && !form.id) {
    return <div className="grid min-h-[50vh] place-items-center bg-[#f7efe2]"><Loader2 className="h-8 w-8 animate-spin text-[#b68655]" /></div>;
  }

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e7d6be] bg-gradient-to-br from-[#fffaf3] via-[#ead8ba] to-[#ead8ba] p-8 shadow-sm md:p-12">
          <p className="font-black tracking-[0.25em] text-[#b68655]">PET PROFILE</p>
          <h1 className="mt-3 text-4xl font-black text-[#4f4032] md:text-5xl">寵物資料管理</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#7b6349]">管理毛孩品種、年齡、體重、照護備註與特殊需求。</p>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-[#e7d6be] bg-[#f7efe2] p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div><p className="text-sm font-black tracking-[0.18em] text-[#b68655]">MY PETS</p><h2 className="mt-1 text-2xl font-black text-[#4f4032]">我的毛孩</h2></div>
              <button type="button" onClick={handleNewPet} className="grid h-12 w-12 place-items-center rounded-full bg-[#b68655] text-white shadow-sm transition hover:bg-[#9a744f]" aria-label="新增寵物"><Plus className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-4">
              {petList.map((pet) => (
                <button key={pet.id} type="button" onClick={() => handleSelectPet(pet)} className={`rounded-3xl border p-5 text-left transition ${selectedPetId === pet.id ? 'border-[#b68655] bg-[#f7efe2] shadow-sm' : 'border-[#e7d6be] bg-white hover:bg-[#f7efe2]'}`}>
                  <div className="flex gap-4">
                    <div className="text-4xl">{pet.avatar}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div><h3 className="font-black text-[#4f4032]">{pet.name || '未命名毛孩'}</h3><p className="text-sm text-[#9c8b78]">{pet.breed || '未填品種'}・{pet.age || '未填年齡'}</p></div>
                        {selectedPetId === pet.id && <span className="rounded-full bg-[#ead8ba] px-3 py-1 text-xs font-black text-[#4f4032]">編輯中</span>}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#7b6349]">{pet.note || '尚未填寫照護備註'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-[#f7efe2] p-5">
              <div className="flex items-start gap-3"><AlertCircle className="mt-1 h-5 w-5 text-[#b68655]" /><p className="text-sm leading-6 text-[#7b6349]">這一頁目前先存 localStorage。若要正式寫入 MySQL，下一步可以新增 pets API。</p></div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#e7d6be] bg-[#f7efe2] p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div><p className="text-sm font-black tracking-[0.18em] text-[#b68655]">EDIT</p><h2 className="mt-1 text-2xl font-black text-[#4f4032]">編輯毛孩資料</h2></div>
              {saved && <span className="rounded-full bg-[#e8f3df] px-4 py-2 text-sm font-black text-[#5f7f4f]">已儲存</span>}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="rounded-[1.5rem] bg-[#f7efe2] p-5"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-white text-4xl shadow-sm">{form.avatar || '🐾'}</div><div><h3 className="text-xl font-black text-[#4f4032]">{form.name || '新增毛孩'}</h3><p className="mt-1 text-sm text-[#9c8b78]">可以修改 emoji 代表不同毛孩</p></div></div></div>
              <div className="grid gap-5 md:grid-cols-2"><Field label="寵物名稱" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Field label="頭像 Emoji" value={form.avatar} onChange={(value) => setForm({ ...form, avatar: value })} /></div>
              <div className="grid gap-5 md:grid-cols-2"><Field label="品種" value={form.breed} onChange={(value) => setForm({ ...form, breed: value })} /><Field label="年齡" value={form.age} onChange={(value) => setForm({ ...form, age: value })} /></div>
              <div className="grid gap-5 md:grid-cols-2"><Field label="體重" value={form.weight} onChange={(value) => setForm({ ...form, weight: value })} /><label className="grid gap-2 text-sm font-black text-[#4f4032]">性別<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 font-medium text-[#4f4032] outline-none transition focus:border-[#c9a77a] focus:bg-white"><option value="男生">男生</option><option value="女生">女生</option><option value="未填寫">未填寫</option></select></label></div>
              <label className="grid gap-2 text-sm font-black text-[#4f4032]">照護備註<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={5} placeholder="例如：怕吹風機、皮膚敏感、需要慢慢安撫、住宿時需自備飼料..." className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 font-medium text-[#4f4032] outline-none transition placeholder:text-[#b8aa98] focus:border-[#c9a77a] focus:bg-white" /></label>
              <div className="rounded-[1.5rem] bg-[#f7efe2] p-5"><div className="flex items-start gap-3"><HeartPulse className="mt-1 h-5 w-5 text-[#b68655]" /><div><h3 className="font-black text-[#4f4032]">健康照護資訊</h3><p className="mt-2 text-sm leading-6 text-[#7b6349]">可記錄疫苗日期、晶片號碼、過敏史與常用獸醫院，方便門市照護。</p></div></div></div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white shadow-sm transition hover:bg-[#6b543d]"><Save className="h-5 w-5" />儲存寵物資料</button><button type="button" onClick={handleDelete} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e7d6be] bg-white px-6 py-4 font-black text-[#9a5c50] transition hover:bg-[#fff1ec]"><Trash2 className="h-5 w-5" />刪除</button></div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-black text-[#4f4032]">{label}<input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 font-medium text-[#4f4032] outline-none transition placeholder:text-[#b8aa98] focus:border-[#c9a77a] focus:bg-white" /></label>;
}

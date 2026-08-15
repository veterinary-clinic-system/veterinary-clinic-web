import { Input, Select } from '@/components/basic';
import { Gender } from '@/types/enums';
import { GENDER_LABEL_VI } from '@/utils/display';
import { BookingForm } from '../use-booking-form';

/** Bước 5 - thông tin chủ nuôi và thú cưng. */
export function StepOwnerPet({
  owner,
  pet,
}: {
  owner: BookingForm['owner'];
  pet: BookingForm['pet'];
}) {
  return (
    <section aria-labelledby="buoc-thong-tin">
      <h2 id="buoc-thong-tin" className="text-lg font-semibold text-foreground">
        Thông tin chủ nuôi và thú cưng
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            type="tel"
            label="Số điện thoại *"
            value={owner.phone}
            readOnly={owner.isLoggedIn}
            onChange={(e) => owner.changePhone(e.target.value)}
            className="w-full read-only:bg-surface-muted"
          />
          {/*
            `aria-live` để trình đọc màn hình báo kết quả tra cứu - nếu không, người
            dùng bàn phím gõ xong số điện thoại và không hề biết ô họ tên vừa tự điền.
          */}
          <p aria-live="polite" className="mt-1 text-xs">
            {owner.lookupState === 'loading' && (
              <span className="text-muted">Đang tra cứu trong hệ thống...</span>
            )}
            {owner.lookupState === 'found' && !owner.isLoggedIn && (
              <span className="text-primary">Đã tìm thấy hồ sơ - thông tin được điền sẵn.</span>
            )}
            {owner.lookupState === 'new' && (
              <span className="text-muted">Số này chưa có hồ sơ - vui lòng nhập họ tên.</span>
            )}
          </p>
        </div>

        <div>
          <Input
            label="Họ và tên *"
            value={owner.fullName}
            readOnly={owner.nameIsReadOnly}
            onChange={(e) => owner.setFullName(e.target.value)}
            className="w-full read-only:bg-surface-muted"
          />
          {owner.nameIsReadOnly && !owner.isLoggedIn && (
            <button
              type="button"
              onClick={owner.unlockName}
              className="mt-1 text-xs text-primary underline"
            >
              Sửa họ tên
            </button>
          )}
        </div>

        <div className="sm:col-span-2">
          <Input
            type="email"
            label="Email (không bắt buộc)"
            value={owner.email}
            onChange={(e) => owner.setEmail(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="font-medium text-foreground">Thú cưng</h3>

        {pet.hasExisting && (
          <div role="group" aria-label="Cách chọn thú cưng" className="mt-2 flex gap-2 text-sm">
            <button
              type="button"
              aria-pressed={pet.mode === 'existing'}
              onClick={() => pet.setMode('existing')}
              className={
                'rounded-lg px-3 py-1.5 ' +
                (pet.mode === 'existing'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-muted text-muted')
              }
            >
              Chọn thú cưng đã có
            </button>
            <button
              type="button"
              aria-pressed={pet.mode === 'new'}
              onClick={() => pet.setMode('new')}
              className={
                'rounded-lg px-3 py-1.5 ' +
                (pet.mode === 'new'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-muted text-muted')
              }
            >
              Thêm thú cưng mới
            </button>
          </div>
        )}

        {pet.mode === 'existing' ? <ExistingPetPicker pet={pet} /> : <NewPetFields pet={pet} />}
      </div>
    </section>
  );
}

function ExistingPetPicker({ pet }: { pet: BookingForm['pet'] }) {
  return (
    <fieldset className="mt-3 space-y-2">
      <legend className="sr-only">Chọn thú cưng đã có trong hồ sơ</legend>
      {pet.myPets?.map((item) => (
        <label
          key={item.id}
          className={
            'flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ' +
            (pet.id === item.id ? 'border-primary bg-primary/5' : 'border-border')
          }
        >
          <input
            type="radio"
            name="petId"
            checked={pet.id === item.id}
            onChange={() => pet.setId(item.id)}
          />
          <span className="text-foreground">{item.name}</span>
          {item.breed?.breedName && <span className="text-muted">· {item.breed.breedName}</span>}
        </label>
      ))}
    </fieldset>
  );
}

function NewPetFields({ pet }: { pet: BookingForm['pet'] }) {
  const { newPet, updateNewPet } = pet;

  return (
    <div className="mt-3 grid gap-4 sm:grid-cols-2">
      <Input
        label="Tên thú cưng *"
        value={newPet.name}
        onChange={(e) => updateNewPet({ name: e.target.value })}
        className="w-full"
      />

      <Select
        label="Giới tính"
        value={newPet.gender}
        onChange={(value) => updateNewPet({ gender: value as Gender })}
        options={Object.values(Gender).map((g) => ({ value: g, label: GENDER_LABEL_VI[g] }))}
        className="w-full"
      />

      <Select
        label="Loài"
        value={newPet.speciesId}
        /* Đổi loài thì giống cũ chắc chắn không còn đúng - xoá luôn. */
        onChange={(value) => updateNewPet({ speciesId: value, breedId: '' })}
        options={[
          { value: '', label: '-- Chọn loài --' },
          ...(pet.speciesList ?? []).map((s) => ({ value: s.id, label: s.speciesName })),
        ]}
        className="w-full"
      />

      <Select
        label="Giống *"
        value={newPet.breedId}
        onChange={(value) => updateNewPet({ breedId: value })}
        disabled={!newPet.speciesId}
        hint={!newPet.speciesId ? 'Chọn loài trước để hiện danh sách giống.' : undefined}
        options={[
          { value: '', label: '-- Chọn giống --' },
          ...(pet.breeds ?? []).map((b) => ({ value: b.id, label: b.breedName })),
        ]}
        className="w-full"
      />

      <Input
        type="number"
        label="Cân nặng (kg)"
        min="0"
        step="0.1"
        value={newPet.weight}
        onChange={(e) => updateNewPet({ weight: e.target.value })}
        className="w-full"
      />

      <Input
        type="date"
        label="Ngày sinh"
        value={newPet.birthDate}
        onChange={(e) => updateNewPet({ birthDate: e.target.value })}
        className="w-full"
      />
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { text, type Locale } from "@/lib/locale";

type FormState = { error?: string; success?: string } | undefined;
type CropAction = (state: FormState, data: FormData) => Promise<FormState>;

function Feedback({ state }: { state: FormState }) {
  if (state?.error) return <p className="crop-feedback error">{state.error}</p>;
  if (state?.success) return <p className="crop-feedback success">{state.success}</p>;
  return null;
}

function CropRow({ crop, saveAction, visibilityAction, deleteAction, locale }: {
  crop: { id: string; nameMr: string; nameEn: string; isActive: boolean };
  saveAction: CropAction;
  visibilityAction: CropAction;
  deleteAction: CropAction;
  locale: Locale;
}) {
  const [saveState, saveFormAction, saving] = useActionState(saveAction, undefined);
  const [visibilityState, visibilityFormAction, changingVisibility] = useActionState(visibilityAction, undefined);
  const [deleteState, deleteFormAction, deleting] = useActionState(deleteAction, undefined);

  return <article className="crop-management-row">
    <form action={saveFormAction} className="crop-edit-form">
      <input type="hidden" name="cropId" value={crop.id} />
      <label className="field">{text(locale, "मराठी पीक नाव", "Crop name in Marathi")}
        <input name="nameMr" defaultValue={crop.nameMr} maxLength={60} required />
      </label>
      <label className="field">{text(locale, "English crop name", "Crop name in English")}
        <input name="nameEn" defaultValue={crop.nameEn} maxLength={60} required />
      </label>
      <button className="button secondary" type="submit" disabled={saving}>{saving ? text(locale, "जतन...", "Saving...") : text(locale, "नाव जतन करा", "Save names")}</button>
      <Feedback state={saveState} />
    </form>
    <div className="crop-management-controls">
      <span className={crop.isActive ? "crop-visibility active" : "crop-visibility"}>{crop.isActive ? text(locale, "सार्वजनिक यादीत दिसते", "Visible to customers") : text(locale, "सार्वजनिक यादीत लपवले", "Hidden from customers")}</span>
      <form action={visibilityFormAction}>
        <input type="hidden" name="cropId" value={crop.id} />
        <input type="hidden" name="isActive" value={String(!crop.isActive)} />
        <button className="button secondary" type="submit" disabled={changingVisibility}>
          {changingVisibility ? text(locale, "बदलत आहे...", "Updating...") : crop.isActive ? text(locale, "लपवा", "Hide") : text(locale, "दाखवा", "Show")}
        </button>
        <Feedback state={visibilityState} />
      </form>
      <form action={deleteFormAction} onSubmit={(event) => {
        const message = locale === "en"
          ? `Permanently delete "${crop.nameEn}" and all its saved rates? Farmer enquiries will be kept.`
          : `"${crop.nameMr} / ${crop.nameEn}" आणि त्याचे सर्व जुने दर कायमचे हटवायचे? चौकशी नोंदी जतन राहतील.`;
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}>
        <input type="hidden" name="cropId" value={crop.id} />
        <button className="button danger-button" type="submit" disabled={deleting}>{deleting ? text(locale, "हटवत आहे...", "Deleting...") : text(locale, "कायमचे हटवा", "Delete permanently")}</button>
        <Feedback state={deleteState} />
      </form>
    </div>
  </article>;
}

export function CropManagement({ crops, saveAction, visibilityAction, deleteAction, locale }: {
  crops: Array<{ id: string; nameMr: string; nameEn: string; isActive: boolean }>;
  saveAction: CropAction;
  visibilityAction: CropAction;
  deleteAction: CropAction;
  locale: Locale;
}) {
  const createAction: CropAction = async (_previousState, data) => saveAction(undefined, data);
  const [createState, createFormAction, creating] = useActionState(createAction, undefined);

  return <section className="crop-manager">
    <div className="admin-title">
      <div><h2>{text(locale, "पीक यादी व्यवस्थापन", "Manage crops")}</h2><p>{text(locale, "नवीन पीक जोडा, नावे बदला किंवा सार्वजनिक यादीत दाखवा / लपवा.", "Add crops, edit names, or show and hide them on the public site.")}</p></div>
    </div>
    <form action={createFormAction} className="panel crop-create-form">
      <label className="field">{text(locale, "मराठी पीक नाव", "Crop name in Marathi")}<input name="nameMr" maxLength={60} required placeholder={text(locale, "उदा. तूर", "e.g. Tur")}/></label>
      <label className="field">{text(locale, "English crop name", "Crop name in English")}<input name="nameEn" maxLength={60} required placeholder="e.g. Tur" /></label>
      <button className="button" type="submit" disabled={creating}>{creating ? text(locale, "जोडत आहे...", "Adding...") : text(locale, "＋ नवीन पीक जोडा", "＋ Add crop")}</button>
      <Feedback state={createState} />
    </form>
    <div className="crop-management-list">
      {crops.length ? crops.map((crop) => <CropRow
        key={crop.id}
        crop={crop}
        locale={locale}
        saveAction={saveAction}
        visibilityAction={visibilityAction}
        deleteAction={deleteAction}
      />      ) : <div className="panel empty">{text(locale, "अजून पीक जोडलेले नाही.", "No crops have been added yet.")}</div>}
    </div>
  </section>;
}

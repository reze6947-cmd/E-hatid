import React, { useState, useRef, useEffect } from 'react';
import {
  IonButton,
  IonInput,
  IonItem,
  IonIcon,
  IonLoading,
  IonText,
} from '@ionic/react';
import { arrowBackOutline, personOutline, mailOutline, callOutline, businessOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline, locationOutline, informationCircleOutline, folderOpenOutline, fileTrayFullOutline, idCardOutline, imageOutline, alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitApplicationDoc } from '../../services/userService';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const GOVERNMENT_ID_TYPES = ['Passport', "Driver's License", 'National ID', 'UMID', 'Postal ID', "Voter's ID", 'PRC ID', 'Other'];
const BUSINESS_DOC_TYPES = ['DTI Registration', 'SEC Certificate', 'Business Permit', "Mayor's Permit", 'BIR Registration', 'Other'];
const CATEGORIES = ['Food & Restaurant', 'Beverages', 'Snacks & Desserts', 'Groceries', 'Services', 'Other'];

type FormErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /\d/g;

const uploadFile = async (file: File, uid: string, prefix: string): Promise<string> => {
  const storageRef = ref(storage, `applications/${uid}/${prefix}-${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

const ApplyVendor: React.FC = () => {
  const history = useHistory();
  const { user, applyForRole } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const [applicationType, setApplicationType] = useState<'individual' | 'business'>('individual');
  const [formData, setFormData] = useState<Record<string, string>>({
    displayName: '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    address: '',
    description: '',
    category: '',
    governmentIdType: '',
    governmentIdNumber: '',
    businessName: '',
    businessRegistrationNumber: '',
    businessDocumentType: '',
    representativeName: '',
    representativeIdType: '',
    representativeIdNumber: '',
    taxIdNumber: '',
  });
  const [files, setFiles] = useState<Record<string, File | null>>({
    governmentIdImage: null,
    businessDocumentImage: null,
    representativeIdImage: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const roleStatus = user?.roleStatus?.vendor || 'none';
  const isPending = roleStatus === 'pending';
  const isApproved = roleStatus === 'approved';
  const isRejected = roleStatus === 'rejected';

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [key]: file }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const scrollToError = () => {
    setTimeout(() => {
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  useEffect(() => {
    if (!user) { history.push('/login'); return; }
  }, [user, history]);

  if (!user) return null;

  if (isApproved) {
    return (
      <>
        <div className="sticky top-0 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
          <button onClick={() => history.goBack()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ion-color-primary)]">
            <IonIcon icon={arrowBackOutline} className="text-lg" />
          </button>
        </div>
        <div className="max-w-md mx-auto px-4 py-[60px] text-center">
          <div className="w-20 h-20 rounded-full bg-[#10B98120] flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={checkmarkCircleOutline} className="text-[40px] text-[#10B981]" />
          </div>
          <h1 className="text-2xl font-bold text-[#10B981] mb-3">Vendor Approved</h1>
          <p className="text-sm text-[var(--ion-text-color-secondary)] mb-6">
            Your vendor application has been approved.
          </p>
          <IonButton expand="block" onClick={() => history.push('/vendor/dashboard')}>
            Go to Vendor Dashboard
          </IonButton>
        </div>
      </>
    );
  }

  if (isPending) {
    return (
      <>
        <div className="sticky top-0 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
          <button onClick={() => history.goBack()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ion-color-primary)]">
            <IonIcon icon={arrowBackOutline} className="text-lg" />
          </button>
        </div>
        <div className="max-w-md mx-auto px-4 py-[60px] text-center">
          <div className="w-20 h-20 rounded-full bg-[#F59E0B20] flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={timeOutline} className="text-[40px] text-[#F59E0B]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F59E0B] mb-3">Pending Approval</h1>
          <p className="text-sm text-[var(--ion-text-color-secondary)] mb-6">
            Your vendor application is currently under review.
          </p>
          <IonButton expand="block" fill="outline" onClick={() => history.push('/customer/home')}>
            Back to Home
          </IonButton>
        </div>
      </>
    );
  }

  if (isRejected) {
    return (
      <>
        <div className="sticky top-0 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
          <button onClick={() => history.goBack()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ion-color-primary)]">
            <IonIcon icon={arrowBackOutline} className="text-lg" />
          </button>
        </div>
        <div className="max-w-md mx-auto px-4 py-[60px] text-center">
          <div className="w-20 h-20 rounded-full bg-[#EF444420] flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={closeCircleOutline} className="text-[40px] text-[#EF4444]" />
          </div>
          <h1 className="text-2xl font-bold text-[#EF4444] mb-3">Application Rejected</h1>
          <p className="text-sm text-[var(--ion-text-color-secondary)] mb-6">
            Your vendor application was rejected.
          </p>
          <IonButton expand="block" fill="outline" onClick={() => history.push('/customer/home')}>
            Back to Home
          </IonButton>
        </div>
      </>
    );
  }

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!formData.displayName || formData.displayName.trim().length < 3) e.displayName = 'Store name is required (min 3 characters)';
    if (!formData.contactEmail) e.contactEmail = 'Contact email is required';
    else if (!EMAIL_RE.test(formData.contactEmail)) e.contactEmail = 'Enter a valid email address';
    if (!formData.contactPhone) e.contactPhone = 'Contact phone is required';
    else if ((formData.contactPhone.match(PHONE_DIGITS_RE) || []).length < 8) e.contactPhone = 'Phone must have at least 8 digits';
    if (!formData.address) e.address = 'Address is required';
    if (!formData.description) e.description = 'Description is required';
    if (!formData.category) e.category = 'Category is required';
    if (applicationType === 'individual') {
      if (!formData.governmentIdType) e.governmentIdType = 'Select an ID type';
      if (!formData.governmentIdNumber) e.governmentIdNumber = 'ID number is required';
      if (!files.governmentIdImage) e.governmentIdImage = 'Government ID image is required';
    } else {
      if (!formData.businessName) e.businessName = 'Business name is required';
      if (!formData.businessRegistrationNumber) e.businessRegistrationNumber = 'Registration number is required';
      if (!formData.businessDocumentType) e.businessDocumentType = 'Select a document type';
      if (!files.businessDocumentImage) e.businessDocumentImage = 'Business document image is required';
      if (!formData.representativeName) e.representativeName = 'Representative name is required';
      if (!formData.representativeIdType) e.representativeIdType = 'Select representative ID type';
      if (!formData.representativeIdNumber) e.representativeIdNumber = 'Representative ID number is required';
      if (!files.representativeIdImage) e.representativeIdImage = 'Representative ID image is required';
    }
    return e;
  };

  const handleApply = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setSubmitError('Please complete all required fields');
      scrollToError();
      return;
    }

    setLoading(true);
    setSubmitError('');
    const uploadedUrls: Record<string, string> = {};

    try {
      if (applicationType === 'individual' && files.governmentIdImage) {
        setUploadProgress('Uploading government ID image...');
        uploadedUrls.governmentIdImageUrl = await uploadFile(files.governmentIdImage, user!.id, 'government-id');
      }
      if (applicationType === 'business') {
        if (files.businessDocumentImage) {
          setUploadProgress('Uploading business document...');
          uploadedUrls.businessDocumentImageUrl = await uploadFile(files.businessDocumentImage, user!.id, 'business-doc');
        }
        if (files.representativeIdImage) {
          setUploadProgress('Uploading representative ID...');
          uploadedUrls.representativeIdImageUrl = await uploadFile(files.representativeIdImage, user!.id, 'representative-id');
        }
      }
    } catch (uploadErr: any) {
      console.error('Upload error:', uploadErr);
      setSubmitError('Failed to upload document. Check connection or file size.');
      setLoading(false);
      setUploadProgress('');
      return;
    }

    const payload: Record<string, any> = {
      ...formData,
      ...uploadedUrls,
      applicationType,
    };

    try {
      setUploadProgress('Submitting application...');
      await applyForRole('vendor', payload);
    } catch (roleErr: any) {
      console.error('Role application error:', roleErr);
      if (roleErr?.message === 'ALREADY_EXISTS') setSubmitError('Already applied or already have this role');
      else if (roleErr?.message === 'EMAIL_NOT_VERIFIED') setSubmitError('Please verify your email before applying');
      else setSubmitError('Submission failed. Please try again.');
      setLoading(false);
      setUploadProgress('');
      return;
    }

    try {
      await submitApplicationDoc(user!.id, 'vendor', payload);
    } catch (docErr: any) {
      console.error('Application doc error:', docErr);
    }

    setLoading(false);
    setUploadProgress('');
    history.replace('/approval-pending?role=vendor');
  };

  const inputStyle = { '--color': 'var(--ion-text-color)' } as any;
  const itemStyle = { marginBottom: '0', '--background': 'var(--ion-card-background)', '--border': '1px solid var(--ion-border-color)' } as any;
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ion-text-color)', textTransform: 'uppercase', opacity: 0.7 };
  const selectStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ion-border-color)', background: 'var(--ion-card-background)', color: 'var(--ion-text-color)', fontFamily: 'inherit', fontSize: '14px' };
  const errorTextStyle: React.CSSProperties = { margin: '4px 0 0', fontSize: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' };

  const renderField = (key: string, label: string, placeholder: string, icon: string, type: any = 'text') => (
    <div style={{ marginBottom: '14px' }} data-error={!!errors[key] ? 'true' : undefined}>
      <label style={labelStyle}>{label}</label>
      <IonItem style={itemStyle}>
        <IonIcon icon={icon} slot="start" color="primary" />
        <IonInput type={type} placeholder={placeholder} value={formData[key]} onIonChange={e => updateField(key, e.detail.value!)} style={inputStyle} />
      </IonItem>
      {errors[key] && <p style={errorTextStyle}><IonIcon icon={alertCircleOutline} style={{ fontSize: '12px' }} />{errors[key]}</p>}
    </div>
  );

  const renderSelect = (key: string, label: string, options: string[], placeholder: string) => (
    <div style={{ marginBottom: '14px' }} data-error={!!errors[key] ? 'true' : undefined}>
      <label style={labelStyle}>{label}</label>
      <select value={formData[key]} onChange={e => updateField(key, e.target.value)} style={selectStyle}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[key] && <p style={errorTextStyle}><IonIcon icon={alertCircleOutline} style={{ fontSize: '12px' }} />{errors[key]}</p>}
    </div>
  );

  const renderFileInput = (key: string, label: string, hint?: string) => (
    <div data-error={!!errors[key] ? 'true' : undefined}>
      <label style={labelStyle}>{label}</label>
      {hint && <p className="text-xs text-[var(--ion-text-color-secondary)] mb-2">{hint}</p>}
      {files[key] ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
          <img src={URL.createObjectURL(files[key]!)} className="w-16 h-16 object-cover rounded shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--ion-text-color)] truncate">{files[key]!.name}</p>
            <button type="button" onClick={() => handleFileChange(key, null)} className="text-xs text-[var(--ion-color-primary)] underline mt-1">
              Replace
            </button>
          </div>
        </div>
      ) : (
        <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-[var(--ion-border-color)] bg-[var(--ion-card-background)] cursor-pointer hover:border-[var(--ion-color-primary)]">
          <IonIcon icon={idCardOutline} className="text-lg text-[var(--ion-text-color-secondary)] shrink-0" />
          <span className="text-sm text-[var(--ion-text-color-secondary)]">Tap to choose a photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(key, e.target.files?.[0] || null)} />
        </label>
      )}
      {errors[key] && <p style={errorTextStyle}><IonIcon icon={alertCircleOutline} style={{ fontSize: '12px' }} />{errors[key]}</p>}
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
        <button onClick={() => history.goBack()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ion-color-primary)]">
          <IonIcon icon={arrowBackOutline} className="text-lg" />
        </button>
      </div>

      <div ref={formRef} className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-[140px]">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="text-[32px] font-extrabold text-[var(--ion-color-primary)] m-0 mb-3">
            Apply as Vendor
          </h1>
          <p className="text-[15px] text-[var(--ion-text-color-secondary)] m-0">
            Submit your application for review
          </p>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 bg-[#fee2e2] p-3 rounded-lg mb-6 text-sm text-[#991b1b] border border-[#fecaca]">
            <IonIcon icon={alertCircleOutline} className="text-base shrink-0" />
            {submitError}
          </div>
        )}

        <div className="mb-6">
          <label style={labelStyle}>Application Type *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1.5">
            <button type="button" onClick={() => { setApplicationType('individual'); setErrors({}); }}
              className={`w-full text-left p-4 rounded-xl border-2 transition min-h-[64px] ${
                applicationType === 'individual'
                  ? 'border-[var(--ion-color-primary)] bg-[var(--ion-color-primary)]/10 shadow-md'
                  : 'border-[var(--ion-border-color)] hover:border-[var(--ion-color-primary)]'
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-semibold text-[var(--ion-text-color)]">Individual</p>
                  <p className="text-sm text-[var(--ion-text-color-secondary)]">For small vendors or personal riders</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => { setApplicationType('business'); setErrors({}); }}
              className={`w-full text-left p-4 rounded-xl border-2 transition min-h-[64px] ${
                applicationType === 'business'
                  ? 'border-[var(--ion-color-primary)] bg-[var(--ion-color-primary)]/10 shadow-md'
                  : 'border-[var(--ion-border-color)] hover:border-[var(--ion-color-primary)]'
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="font-semibold text-[var(--ion-text-color)]">Business</p>
                  <p className="text-sm text-[var(--ion-text-color-secondary)]">For registered companies or fleets</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[15px] font-bold text-[var(--ion-text-color)] m-0 mb-4">Applicant Info</h3>
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {renderField('displayName', 'Store / Display Name *', 'Your store or business name', businessOutline)}
            {renderField('contactEmail', 'Contact Email *', 'your@email.com', mailOutline, 'email')}
            {renderField('contactPhone', 'Contact Phone *', '(02) 8-634-1111', callOutline, 'tel')}
            <div className="md:col-span-2">{renderField('address', 'Address *', 'Your business address', locationOutline)}</div>
            {renderField('description', 'Description *', 'Short description of your business', informationCircleOutline)}
            <div>{renderSelect('category', 'Category *', CATEGORIES, 'Select a category')}</div>
          </div>
        </div>

        {applicationType === 'individual' ? (
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-[var(--ion-text-color)] m-0 mb-4">ID Verification</h3>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>{renderSelect('governmentIdType', 'Government ID Type *', GOVERNMENT_ID_TYPES, 'Select ID type')}</div>
              <div>{renderField('governmentIdNumber', 'Government ID Number *', 'ID number', idCardOutline)}</div>
              <div className="md:col-span-2">{renderFileInput('governmentIdImage', 'Take a photo or upload your ID *', 'Make sure text is clear and not blurry')}</div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-[var(--ion-text-color)] m-0 mb-4">Business Info</h3>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>{renderField('businessName', 'Registered Business Name *', 'Registered business name', businessOutline)}</div>
              <div>{renderField('businessRegistrationNumber', 'Business Registration Number *', 'DTI / SEC / Permit number', fileTrayFullOutline)}</div>
              <div>{renderSelect('businessDocumentType', 'Business Document Type *', BUSINESS_DOC_TYPES, 'Select document type')}</div>
              <div className="md:col-span-2">{renderFileInput('businessDocumentImage', 'Take a photo or upload business document *', 'Upload DTI, SEC, or business permit')}</div>
              <div>{renderField('representativeName', 'Representative Full Name *', 'Representative name', personOutline)}</div>
              <div>{renderSelect('representativeIdType', 'Representative ID Type *', GOVERNMENT_ID_TYPES, 'Select ID type')}</div>
              <div>{renderField('representativeIdNumber', 'Representative ID Number *', 'Representative ID number', idCardOutline)}</div>
              <div className="md:col-span-2">{renderFileInput('representativeIdImage', 'Take a photo or upload representative ID *', 'Make sure text is clear and not blurry')}</div>
              <div className="md:col-span-2">{renderField('taxIdNumber', 'Tax ID Number (TIN) — Optional', 'TIN (optional)', folderOpenOutline)}</div>
            </div>
          </div>
        )}

        <IonButton expand="block" size="large" shape="round" disabled={loading} className="w-full md:w-auto font-bold mb-6" onClick={handleApply}>
          {loading ? 'Processing...' : 'Submit Application'}
        </IonButton>
      </div>
      <IonLoading isOpen={loading} message={uploadProgress || 'Submitting application...'} />
    </>
  );
};

export default ApplyVendor;

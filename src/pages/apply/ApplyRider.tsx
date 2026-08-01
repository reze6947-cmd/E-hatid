import React, { useState, useRef, useEffect } from 'react';
import {
  IonButton,
  IonInput,
  IonItem,
  IonIcon,
  IonLoading,
} from '@ionic/react';
import { arrowBackOutline, personOutline, mailOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline, locationOutline, idCardOutline, bicycleOutline, carOutline, businessOutline, fileTrayFullOutline, alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitApplicationDoc } from '../../services/userService';
import { SUFFIXES, PH_REGIONS, formatNationalPH, fromStoredPhone, toStoredPhone, splitFullName, joinName, joinAddress } from '../../utils/profile';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const GOVERNMENT_ID_TYPES = ['Passport', "Driver's License", 'National ID', 'UMID', 'Postal ID', "Voter's ID", 'PRC ID', 'Other'];

type FormErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /\d/g;

const uploadFile = async (file: File, uid: string, prefix: string): Promise<string> => {
  const storageRef = ref(storage, `applications/${uid}/${prefix}-${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

const ApplyRider: React.FC = () => {
  const history = useHistory();
  const { user, applyForRole } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const [applicationType, setApplicationType] = useState<'individual' | 'business'>('individual');
  const [vehicleType, setVehicleType] = useState<'bike' | 'motorcycle' | 'car'>('bike');
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const nameParts = splitFullName(user?.name);
    return {
      firstName: nameParts.firstName,
      middleName: nameParts.middleName,
      lastName: nameParts.lastName,
      suffix: nameParts.suffix,
      contactEmail: user?.email || '',
      contactPhone: fromStoredPhone(user?.phone),
      addressStreet: '',
      addressBarangay: '',
      addressCity: '',
      addressProvince: '',
      addressRegion: '',
      addressZip: '',
      governmentIdType: '',
      governmentIdNumber: '',
      driverLicenseNumber: '',
      companyName: '',
      companyRegistrationNumber: '',
      assignedRiderName: '',
      assignedRiderLicenseNumber: '',
    };
  });
  const [files, setFiles] = useState<Record<string, File | null>>({
    governmentIdImage: null,
    driverLicenseImage: null,
    businessDocumentImage: null,
    assignedRiderLicenseImage: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const roleStatus = user?.roleStatus?.rider || 'none';
  const isPending = roleStatus === 'pending';
  const isApproved = roleStatus === 'approved';
  const isRejected = roleStatus === 'rejected';
  const isVerified = user?.emailVerified === true;

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

  if (!isVerified) {
    return (
      <>
        <div className="sticky top-0 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
          <button onClick={() => history.goBack()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ion-color-primary)]">
            <IonIcon icon={arrowBackOutline} className="text-lg" />
          </button>
        </div>
        <div className="max-w-md mx-auto px-4 py-[60px] text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-[var(--ion-text-color)] mb-3">Email Not Verified</h1>
          <p className="text-sm text-[var(--ion-text-color-secondary)] mb-6">
            You must verify your email before applying as a rider.
          </p>
          <IonButton expand="block" onClick={() => history.push('/verify-otp')}>
            Go to Verification
          </IonButton>
        </div>
      </>
    );
  }

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
          <h1 className="text-2xl font-bold text-[#10B981] mb-3">Rider Approved</h1>
          <p className="text-sm text-[var(--ion-text-color-secondary)] mb-6">
            Your rider application has been approved.
          </p>
          <IonButton expand="block" onClick={() => history.push('/rider/dashboard')}>
            Go to Rider Dashboard
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
            Your rider application is currently under review.
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
            Your rider application was rejected.
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
    if (!formData.firstName || formData.firstName.trim().length < 2) e.firstName = 'Please enter your first name';
    if (!formData.lastName || formData.lastName.trim().length < 2) e.lastName = 'Please enter your last name';
    if (!formData.contactEmail) e.contactEmail = 'Contact email is required';
    else if (!EMAIL_RE.test(formData.contactEmail)) e.contactEmail = 'Enter a valid email address';
    const phoneDigits = (formData.contactPhone.match(PHONE_DIGITS_RE) || []);
    if (phoneDigits.length === 0) e.contactPhone = 'Contact phone is required';
    else if (phoneDigits.length < 10) e.contactPhone = 'Enter a complete 10-digit mobile number';
    if (!formData.addressStreet) e.addressStreet = 'Street is required';
    if (!formData.addressBarangay) e.addressBarangay = 'Barangay is required';
    if (!formData.addressCity) e.addressCity = 'City / Municipality is required';
    if (applicationType === 'individual') {
      if (!formData.governmentIdType) e.governmentIdType = 'Select an ID type';
      if (!formData.governmentIdNumber) e.governmentIdNumber = 'ID number is required';
      if (!files.governmentIdImage) e.governmentIdImage = 'Please upload your ID image';
      if (vehicleType !== 'bike') {
        if (!formData.driverLicenseNumber) e.driverLicenseNumber = 'Driver license is required for ' + vehicleType;
        if (!files.driverLicenseImage) e.driverLicenseImage = 'Please upload your driver license image';
      }
    } else {
      if (!formData.companyName) e.companyName = 'Company name is required';
      if (!formData.companyRegistrationNumber) e.companyRegistrationNumber = 'Registration number is required';
      if (!files.businessDocumentImage) e.businessDocumentImage = 'Please upload your business document image';
      if (!formData.assignedRiderName) e.assignedRiderName = 'Assigned rider name is required';
      if (!formData.assignedRiderLicenseNumber) e.assignedRiderLicenseNumber = 'Rider license number is required';
      if (!files.assignedRiderLicenseImage) e.assignedRiderLicenseImage = 'Please upload the rider license image';
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
      if (applicationType === 'individual') {
        if (files.governmentIdImage) {
          setUploadProgress('Uploading government ID...');
          uploadedUrls.governmentIdImageUrl = await uploadFile(files.governmentIdImage, user!.id, 'rider-government-id');
        }
        if (vehicleType !== 'bike' && files.driverLicenseImage) {
          setUploadProgress('Uploading driver license...');
          uploadedUrls.driverLicenseImageUrl = await uploadFile(files.driverLicenseImage, user!.id, 'rider-driver-license');
        }
      } else {
        if (files.businessDocumentImage) {
          setUploadProgress('Uploading business document...');
          uploadedUrls.businessDocumentImageUrl = await uploadFile(files.businessDocumentImage, user!.id, 'rider-business-doc');
        }
        if (files.assignedRiderLicenseImage) {
          setUploadProgress('Uploading assigned rider license...');
          uploadedUrls.assignedRiderLicenseImageUrl = await uploadFile(files.assignedRiderLicenseImage, user!.id, 'rider-assigned-license');
        }
      }
    } catch (uploadErr: any) {
      console.error('Upload error:', uploadErr);
      setSubmitError('Failed to upload document. Check your connection or file size (max 5MB).');
      setLoading(false);
      setUploadProgress('');
      return;
    }

    const composedName = joinName({
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      suffix: formData.suffix,
    });
    const composedAddress = joinAddress({
      addressStreet: formData.addressStreet,
      addressBarangay: formData.addressBarangay,
      addressCity: formData.addressCity,
      addressProvince: formData.addressProvince,
      addressRegion: formData.addressRegion,
      addressZip: formData.addressZip,
    });
    const payload: Record<string, any> = {
      ...formData,
      fullName: composedName,
      address: composedAddress,
      contactPhone: toStoredPhone(formData.contactPhone),
      ...uploadedUrls,
      applicationType,
      vehicleType,
    };

    try {
      setUploadProgress('Submitting application...');
      await applyForRole('rider', payload);
    } catch (roleErr: any) {
      console.error('Role application error:', roleErr);
      if (roleErr?.message === 'ALREADY_EXISTS') setSubmitError('Already applied or already have this role');
      else if (roleErr?.message === 'EMAIL_NOT_VERIFIED') setSubmitError('Please verify your email before applying');
      else setSubmitError('Submission failed. Please check your inputs and try again.');
      setLoading(false);
      setUploadProgress('');
      return;
    }

    try {
      await submitApplicationDoc(user!.id, 'rider', payload);
    } catch (docErr: any) {
      console.error('Application doc error:', docErr);
    }

    setLoading(false);
    setUploadProgress('');
    history.replace('/approval-pending?role=rider');
  };

  const inputStyle = { '--color': 'var(--ion-text-color)' } as any;
  const itemStyle = { marginBottom: '0', '--background': 'var(--ion-card-background)', '--border': '1px solid var(--ion-border-color)' } as any;
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ion-text-color)', textTransform: 'uppercase', opacity: 0.7 };
  const selectStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ion-border-color)', background: 'var(--ion-card-background)', color: 'var(--ion-text-color)', fontFamily: 'inherit', fontSize: '14px' };
  const errorTextStyle: React.CSSProperties = { margin: '4px 0 0', fontSize: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' };

  const renderField = (key: string, label: string, placeholder: string, icon: string, type: any = 'text') => (
    <div data-error={!!errors[key] ? 'true' : undefined}>
      <label style={labelStyle}>{label}</label>
      <IonItem style={itemStyle}>
        <IonIcon icon={icon} slot="start" color="primary" />
        <IonInput type={type} placeholder={placeholder} value={formData[key]} onIonChange={e => updateField(key, e.detail.value!)} style={inputStyle} />
      </IonItem>
      {errors[key] && <p style={errorTextStyle}><IonIcon icon={alertCircleOutline} style={{ fontSize: '12px' }} />{errors[key]}</p>}
    </div>
  );

  const renderSelect = (key: string, label: string, options: string[], placeholder: string) => (
    <div data-error={!!errors[key] ? 'true' : undefined}>
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
          <div className="text-5xl mb-4">🚴</div>
          <h1 className="text-[32px] font-extrabold text-[var(--ion-color-primary)] m-0 mb-3">
            Apply as Rider
          </h1>
          <p className="text-[15px] text-[var(--ion-text-color-secondary)] m-0">
            Submit your rider application for review
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
            {renderField('firstName', 'First Name *', 'First name', personOutline)}
            {renderField('middleName', 'Middle Name (optional)', 'Middle name', personOutline)}
            {renderField('lastName', 'Last Name *', 'Last name', personOutline)}
            <div>
              <label style={labelStyle}>Suffix</label>
              <select value={formData.suffix || ''} onChange={e => updateField('suffix', e.target.value)} style={selectStyle}>
                <option value="">None</option>
                {SUFFIXES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {renderField('contactEmail', 'Contact Email *', 'your@email.com', mailOutline, 'email')}
            <div data-error={!!errors.contactPhone ? 'true' : undefined}>
              <label style={labelStyle}>Contact Phone *</label>
              <div className="flex items-stretch">
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid var(--ion-border-color)', borderRight: 'none', borderRadius: '8px 0 0 8px', background: 'var(--ion-background-color)', fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color)' }}>+63</span>
                <IonItem style={{ ...itemStyle, borderRadius: '0 8px 8px 0', flex: 1 }}>
                  <IonInput type="tel" placeholder="917 123 4567" value={formData.contactPhone} onIonChange={e => updateField('contactPhone', formatNationalPH(e.detail.value!))} style={inputStyle} />
                </IonItem>
              </div>
              {errors.contactPhone && <p style={errorTextStyle}><IonIcon icon={alertCircleOutline} style={{ fontSize: '12px' }} />{errors.contactPhone}</p>}
            </div>
            <div className="md:col-span-2">
              <h4 className="text-[13px] font-bold text-[var(--ion-text-color)] m-0 mb-4">Address</h4>
              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                <div className="md:col-span-2">{renderField('addressStreet', 'Street / Unit *', 'e.g. 123 Mabini St.', locationOutline)}</div>
                <div>{renderField('addressBarangay', 'Barangay *', 'e.g. Barangay San Jose', locationOutline)}</div>
                <div>{renderField('addressCity', 'City / Municipality *', 'e.g. Quezon City', locationOutline)}</div>
                <div>{renderField('addressProvince', 'Province', 'e.g. Metro Manila', locationOutline)}</div>
                <div>{renderSelect('addressRegion', 'Region', PH_REGIONS, 'Select region')}</div>
                <div className="md:col-span-2">{renderField('addressZip', 'ZIP Code', 'e.g. 1100', locationOutline)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[15px] font-bold text-[var(--ion-text-color)] m-0 mb-4">Vehicle Type *</h3>
          <div className="flex gap-2">
            {(['bike', 'motorcycle', 'car'] as const).map(v => (
              <button key={v} onClick={() => setVehicleType(v)} className="flex-1 p-2.5 rounded-lg border-2 font-semibold text-[12px] cursor-pointer capitalize" style={{ borderColor: vehicleType === v ? 'var(--ion-color-primary)' : 'var(--ion-border-color)', background: vehicleType === v ? 'var(--ion-color-primary)/10' : 'var(--ion-card-background)', color: 'var(--ion-text-color)' }}>
                <IonIcon icon={v === 'bike' ? bicycleOutline : carOutline} className="block mx-auto mb-1 text-xl" />
                {v}
              </button>
            ))}
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

            {vehicleType !== 'bike' && (
              <div className="mt-6">
                <h4 className="text-[14px] font-bold text-[var(--ion-text-color)] m-0 mb-4">Driver License</h4>
                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  <div>{renderField('driverLicenseNumber', 'Driver License Number *', 'License number', idCardOutline)}</div>
                  <div className="md:col-span-2">{renderFileInput('driverLicenseImage', 'Take a photo or upload your driver license *', 'Make sure all details are readable')}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-[var(--ion-text-color)] m-0 mb-4">Company / Fleet Info</h3>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>{renderField('companyName', 'Company Name *', 'Company name', businessOutline)}</div>
              <div>{renderField('companyRegistrationNumber', 'Company Registration Number *', 'Registration number', fileTrayFullOutline)}</div>
              <div className="md:col-span-2">{renderFileInput('businessDocumentImage', 'Take a photo or upload business document *', 'Upload DTI, SEC, or business permit')}</div>
              <div>{renderField('assignedRiderName', 'Assigned Rider Name *', 'Rider full name', personOutline)}</div>
              <div>{renderField('assignedRiderLicenseNumber', 'Assigned Rider License Number *', 'License number', idCardOutline)}</div>
              <div className="md:col-span-2">{renderFileInput('assignedRiderLicenseImage', 'Take a photo or upload rider license *', 'Make sure all details are readable')}</div>
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

export default ApplyRider;

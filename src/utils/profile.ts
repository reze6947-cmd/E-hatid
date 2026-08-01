export const SUFFIXES = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV'];

export const PH_REGIONS = [
  'NCR',
  'CAR',
  'Region I (Ilocos Region)',
  'Region II (Cagayan Valley)',
  'Region III (Central Luzon)',
  'Region IV-A (CALABARZON)',
  'MIMAROPA Region',
  'Region V (Bicol Region)',
  'Region VI (Western Visayas)',
  'Region VII (Central Visayas)',
  'Region VIII (Eastern Visayas)',
  'Region IX (Zamboanga Peninsula)',
  'Region X (Northern Mindanao)',
  'Region XI (Davao Region)',
  'Region XII (SOCCSKSARGEN)',
  'Region XIII (Caraga)',
  'BARMM',
];

export const formatNationalPH = (digits: string): string => {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
};

export const toStoredPhone = (nationalDigits: string): string => {
  const d = nationalDigits.replace(/\D/g, '').slice(0, 10);
  if (!d) return '';
  const full = `0${d}`;
  return `${full.slice(0, 4)} ${full.slice(4, 7)} ${full.slice(7, 11)}`.trim();
};

export const fromStoredPhone = (value: string | undefined): string => {
  if (!value) return '';
  let d = value.replace(/\D/g, '');
  if (d.startsWith('63')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return formatNationalPH(d);
};

export interface NameParts {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
}

export const splitFullName = (name: string | undefined): NameParts => {
  const n = (name || '').trim().replace(/\s+/g, ' ');
  if (!n) return { firstName: '', middleName: '', lastName: '', suffix: '' };
  const parts = n.split(' ');
  const lastRaw = parts[parts.length - 1];
  if (SUFFIXES.slice(1).includes(lastRaw)) {
    const lastName = parts[parts.length - 2] || '';
    const middleParts = parts.slice(1, parts.length - 2);
    return {
      firstName: parts[0],
      middleName: middleParts.join(' '),
      lastName,
      suffix: lastRaw,
    };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, parts.length - 1).join(' '),
    lastName: lastRaw,
    suffix: '',
  };
};

export const joinName = (p: NameParts): string =>
  [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(' ');

export interface AddressParts {
  addressStreet: string;
  addressBarangay: string;
  addressCity: string;
  addressProvince: string;
  addressRegion: string;
  addressZip: string;
}

export const joinAddress = (p: AddressParts): string => {
  const line1 = [p.addressStreet, p.addressBarangay].filter(Boolean).join(', ');
  const line2 = [p.addressCity, p.addressProvince, p.addressRegion].filter(Boolean).join(', ');
  const zip = p.addressZip ? ` ${p.addressZip}` : '';
  return [line1, line2].filter(Boolean).join(', ') + zip;
};

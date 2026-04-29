export interface Ticker {
  symbol: string;   // Yahoo Finance e.g. COMI.CA
  egx_code: string; // e.g. COMI
  name_en: string;
  name_ar: string;
  sector: string;
  index_group: string;
}

export const EGX30_TICKERS: Ticker[] = [
  { symbol:'COMI.CA', egx_code:'COMI', name_en:'Commercial International Bank', name_ar:'البنك التجاري الدولي', sector:'Banking', index_group:'EGX30' },
  { symbol:'HRHO.CA', egx_code:'HRHO', name_en:'EFG Hermes Holding', name_ar:'هيرميس القابضة', sector:'Financial Services', index_group:'EGX30' },
  { symbol:'EAST.CA', egx_code:'EAST', name_en:'Eastern Company', name_ar:'الشرقية للدخان', sector:'Consumer Staples', index_group:'EGX30' },
  { symbol:'TMGH.CA', egx_code:'TMGH', name_en:'Talaat Mostafa Group', name_ar:'طلعت مصطفى القابضة', sector:'Real Estate', index_group:'EGX30' },
  { symbol:'ETEL.CA', egx_code:'ETEL', name_en:'Telecom Egypt', name_ar:'المصرية للاتصالات', sector:'Telecom', index_group:'EGX30' },
  { symbol:'EKHO.CA', egx_code:'EKHO', name_en:'Egyptian Kuwaiti Holding', name_ar:'المصرية الكويتية', sector:'Diversified', index_group:'EGX30' },
  { symbol:'ABUK.CA', egx_code:'ABUK', name_en:'Abu Qir Fertilizers', name_ar:'أبو قير للأسمدة', sector:'Basic Materials', index_group:'EGX30' },
  { symbol:'SWDY.CA', egx_code:'SWDY', name_en:'El Sewedy Electric', name_ar:'السويدي إليكتريك', sector:'Industrials', index_group:'EGX30' },
  { symbol:'PHDC.CA', egx_code:'PHDC', name_en:'Palm Hills Development', name_ar:'بالم هيلز للتعمير', sector:'Real Estate', index_group:'EGX30' },
  { symbol:'JUFO.CA', egx_code:'JUFO', name_en:'Juhayna Food Industries', name_ar:'جهينة للصناعات الغذائية', sector:'Consumer Staples', index_group:'EGX30' },
  { symbol:'ISPH.CA', egx_code:'ISPH', name_en:'Ibnsina Pharma', name_ar:'ابن سينا فارما', sector:'Healthcare', index_group:'EGX30' },
  { symbol:'SKPC.CA', egx_code:'SKPC', name_en:'Sidi Kerir Petrochemicals', name_ar:'سيدي كرير للبتروكيماويات', sector:'Basic Materials', index_group:'EGX30' },
  { symbol:'ORWE.CA', egx_code:'ORWE', name_en:'Oriental Weavers', name_ar:'الشرقية للسجاد', sector:'Consumer Discretionary', index_group:'EGX30' },
  { symbol:'MFPC.CA', egx_code:'MFPC', name_en:'Misr Fertilizers (MOPCO)', name_ar:'موبكو للأسمدة', sector:'Basic Materials', index_group:'EGX30' },
  { symbol:'MNHD.CA', egx_code:'MNHD', name_en:'Madinet Nasr Housing', name_ar:'مدينة نصر للإسكان', sector:'Real Estate', index_group:'EGX30' },
  { symbol:'POUL.CA', egx_code:'POUL', name_en:'Cairo Poultry', name_ar:'القاهرة للدواجن', sector:'Consumer Staples', index_group:'EGX30' },
  { symbol:'AUTO.CA', egx_code:'AUTO', name_en:'GB Auto', name_ar:'جي بي أوتو', sector:'Consumer Discretionary', index_group:'EGX30' },
  { symbol:'FWRY.CA', egx_code:'FWRY', name_en:'Fawry for Banking Technology', name_ar:'فوري للخدمات المصرفية', sector:'Technology', index_group:'EGX30' },
  { symbol:'EFID.CA', egx_code:'EFID', name_en:'Edita Food Industries', name_ar:'إيديتا للصناعات الغذائية', sector:'Consumer Staples', index_group:'EGX30' },
  { symbol:'IDHC.CA', egx_code:'IDHC', name_en:'Integrated Diagnostics Holdings', name_ar:'مجموعة التشخيص المتكاملة', sector:'Healthcare', index_group:'EGX30' },
  { symbol:'AMOC.CA', egx_code:'AMOC', name_en:'Alexandria Mineral Oils', name_ar:'الإسكندرية لزيوت المعادن', sector:'Energy', index_group:'EGX30' },
  { symbol:'OCDI.CA', egx_code:'OCDI', name_en:'Orascom Construction', name_ar:'أوراسكوم للإنشاء', sector:'Industrials', index_group:'EGX30' },
  { symbol:'RAYA.CA', egx_code:'RAYA', name_en:'Raya Holding', name_ar:'راية للتكنولوجيا', sector:'Technology', index_group:'EGX30' },
  { symbol:'SUGR.CA', egx_code:'SUGR', name_en:'Delta Sugar Company', name_ar:'دلتا للسكر', sector:'Consumer Staples', index_group:'EGX30' },
  { symbol:'HELI.CA', egx_code:'HELI', name_en:'Heliopolis Housing', name_ar:'مصر الجديدة للإسكان', sector:'Real Estate', index_group:'EGX30' },
  { symbol:'SUCE.CA', egx_code:'SUCE', name_en:'Suez Cement', name_ar:'أسمنت السويس', sector:'Basic Materials', index_group:'EGX30' },
  { symbol:'ORAS.CA', egx_code:'ORAS', name_en:'Orascom Development Egypt', name_ar:'أوراسكوم للتنمية', sector:'Real Estate', index_group:'EGX30' },
  { symbol:'CLHO.CA', egx_code:'CLHO', name_en:'Cleopatra Hospital', name_ar:'مستشفى كليوباترا', sector:'Healthcare', index_group:'EGX30' },
  { symbol:'EFIN.CA', egx_code:'EFIN', name_en:'E-Finance', name_ar:'إي-فاينانس', sector:'Technology', index_group:'EGX30' },
  { symbol:'BFIN.CA', egx_code:'BFIN', name_en:'Beltone Financial', name_ar:'بلتون المالية القابضة', sector:'Financial Services', index_group:'EGX30' },
];

export const SECTOR_COLORS: Record<string, string> = {
  Banking: '#3b82f6', 'Financial Services': '#8b5cf6', 'Consumer Staples': '#10b981',
  'Real Estate': '#f59e0b', Telecom: '#06b6d4', Diversified: '#6b7280',
  'Basic Materials': '#84cc16', Industrials: '#f97316', Healthcare: '#ec4899',
  Technology: '#14b8a6', 'Consumer Discretionary': '#a855f7', Energy: '#ef4444',
};

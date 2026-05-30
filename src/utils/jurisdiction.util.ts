export const divisionMap: Record<string, string> = {
    "Dhaka": "ঢাকা",
    "Chattogram": "চট্টগ্রাম",
    "Chittagong": "চট্টগ্রাম",
    "Khulna": "খুলনা",
    "Rajshahi": "রাজশাহী",
    "Barishal": "বরিশাল",
    "Barisal": "বরিশাল",
    "Sylhet": "সিলেট",
    "Rangpur": "রংপুর",
    "Mymensingh": "ময়মনসিংহ",
};

export const districtMap: Record<string, string> = {
    "Dhaka": "ঢাকা",
    "Gazipur": "গাজীপুর",
    "Narayanganj": "নারায়ণগঞ্জ",
    "Tangail": "টাঙ্গাইল",
    "Faridpur": "ফরিদপুর",
    "Gopalganj": "গোপালগঞ্জ",
    "Kishoreganj": "কিশোরগঞ্জ",
    "Madaripur": "মাদারীপুর",
    "Manikganj": "মানিকগঞ্জ",
    "Munshiganj": "মুন্সীগঞ্জ",
    "Narsingdi": "নরসিংদী",
    "Rajbari": "রাজবাড়ী",
    "Shariatpur": "শরীয়তপুর",
    "Chattogram": "চট্টগ্রাম",
    "Chittagong": "চট্টগ্রাম",
    "Cox's Bazar": "কক্সবাজার",
    "Bandarban": "বান্দরবান",
    "Khagrachhari": "খাগড়াছড়ি",
    "Rangamati": "রাঙামাটি",
    "Brahmanbaria": "ব্রাহ্মণবাড়িয়া",
    "Chandpur": "চাঁদপুর",
    "Cumilla": "কুমিল্লা",
    "Comilla": "কুমিল্লা",
    "Feni": "ফেনী",
    "Lakshmipur": "লক্ষ্মীপুর",
    "Noakhali": "নোয়াখালী",
    "Khulna": "খুলনা",
    "Bagerhat": "বাগেরহাট",
    "Chuadanga": "চুয়াডাঙ্গা",
    "Jashore": "যশোর",
    "Jessore": "যশোর",
    "Jhenaidah": "ঝিনাইদহ",
    "Kushtia": "কুষ্টিয়া",
    "Magura": "মাগুরা",
    "Meherpur": "মেহেরপুর",
    "Narail": "নড়াইল",
    "Satkhira": "সাতক্ষীরা",
    "Rajshahi": "রাজশাহী",
    "Bogura": "বগুড়া",
    "Bogra": "বগুড়া",
    "Joypurhat": "জয়পুরহাট",
    "Naogaon": "নওগাঁ",
    "Natore": "নাটোর",
    "Chapai Nawabganj": "চাঁপাইনবাবগঞ্জ",
    "Pabna": "পাবনা",
    "Sirajganj": "সিরাজগঞ্জ",
    "Barishal": "বরিশাল",
    "Barisal": "বরিশাল",
    "Barguna": "বরগুনা",
    "Bhola": "ভোলা",
    "Jhalokathi": "ঝালকাঠি",
    "Patuakhali": "পটুয়াখালী",
    "Pirojpur": "পিরোজপুর",
    "Sylhet": "সিলেট",
    "Habiganj": "হবিগঞ্জ",
    "Moulvibazar": "মৌলভীবাজার",
    "Sunamganj": "সুনামগঞ্জ",
    "Rangpur": "রংপুর",
    "Dinajpur": "দিনাজপুর",
    "Gaibandha": "গাইবান্ধা",
    "Kurigram": "কুড়িগ্রাম",
    "Lalmonirhat": "লালমনিরহাট",
    "Nilphamari": "নীলফামারী",
    "Panchagarh": "পঞ্চগড়",
    "Thakurgaon": "ঠাকুরগাঁও",
    "Mymensingh": "ময়মনসিংহ",
    "Jamalpur": "জামালপুর",
    "Netrokona": "নেত্রকোণা",
    "Sherpur": "শেরপুর",
};

// Inverse maps
const createInverseMap = (map: Record<string, string>) => {
    const inverse: Record<string, string> = {};
    for (const key in map) {
        inverse[map[key]] = key;
    }
    return inverse;
};

export const divisionMapBn = createInverseMap(divisionMap);
export const districtMapBn = createInverseMap(districtMap);

export const upazilaMap: Record<string, string> = {
    "Lakshmipur Sadar": "লক্ষ্মীপুর সদর",
    "Laxmipur Sadar": "লক্ষ্মীপুর সদর",
};

export const upazilaMapBn = createInverseMap(upazilaMap);

export const translateToBn = (name: string | null | undefined): string | null => {
    if (!name) return null;
    return divisionMap[name] || districtMap[name] || upazilaMap[name] || name;
};

export const translateToEn = (name: string | null | undefined): string | null => {
    if (!name) return null;
    return divisionMapBn[name] || districtMapBn[name] || upazilaMapBn[name] || name;
};

export const normalizeJurisdiction = (name: string | null | undefined): string[] => {
    if (!name) return [];
    const bn = translateToBn(name);
    const en = translateToEn(name);
    const results = new Set<string>();
    if (name) results.add(name);
    if (bn) results.add(bn);
    if (en) results.add(en);
    return Array.from(results);
};

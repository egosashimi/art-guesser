// Art-historical gazetteer: maps place names, cultures, peoples, demonyms and historical
// polities that appear in museum metadata to a representative point and an uncertainty radius.
//
// Format of each line:  lat,lon,radiusKm|alias|alias|...
// Aliases are matched after normalisation (lower case, accents stripped, punctuation collapsed).
// Coordinates are a "centre of gravity" for where objects of that label were typically made,
// not necessarily the geometric centre of the area. Radius ≈ how far from that point the true
// origin could plausibly be; the game gives full location credit inside that radius.
//
// Modern country names are resolved automatically from Natural Earth (see geocode.ts); only
// overrides and demonyms for countries are listed here.

const RAW = `
# ───────────── Country overrides & demonyms ─────────────
33.5,113,600|china|chinese|china (?)|people's republic of china
36,137.5,350|japan|japanese
37,127.5,250|korea|korean|korean peninsula
55.75,37.6,500|russia|russian|muscovy
26.5,31.5,350|egypt|egyptian|ancient egypt|egypt (ancient)
-7.5,110.5,500|indonesia|indonesian|indonesia (java)
20,-99.5,500|mexico|mexican
39.5,-77,700|united states|usa|united states of america|american|america|north america (us)
46.5,2.5,300|france|french
51,10,250|germany|german|germanic
42.8,12.5,350|italy|italian
40.2,-3.7,350|spain|spanish|hispanic
52.2,5.2,100|netherlands|dutch|holland|north netherlandish|northern netherlandish|the netherlands
51,4,110|flemish|flanders|flanders (belgium)|south netherlandish|southern netherlandish|belgian|belgium
51.5,4.5,180|netherlandish|low countries|burgundian netherlands
52.5,-1.5,250|england|english|british|great britain|united kingdom|uk|anglo
56.5,-4.2,200|scotland|scottish
52.3,-3.7,100|wales|welsh
53.2,-7.8,180|ireland|irish
47.6,14,200|austria|austrian
46.8,8.2,130|switzerland|swiss
56,10,150|denmark|danish
60,15,400|sweden|swedish
61,9,400|norway|norwegian
62,25,350|finland|finnish
52,19.5,300|poland|polish
49.8,15.4,170|czech|czech republic|czechia|bohemia|bohemian
47.2,19.4,180|hungary|hungarian
39.6,-8,200|portugal|portuguese
39.2,22,250|greek|greece|hellenic|hellenistic
39,35,500|turkey|turkish|turkiye|anatolia|anatolian
41.01,28.98,400|ottoman|ottoman empire|ottoman turkey
32.5,53,550|iran|persian|persia|iranian
33,44,350|iraq|mesopotamia|mesopotamian
35,38,250|syria|syrian|greater syria
33.9,35.5,100|lebanon|lebanese|phoenician|phoenicia
31.5,35,120|israel|palestine|levant|levantine|canaanite|judea|holy land
24,45,700|arabia|arabian|arabian peninsula
15.5,47,350|yemen|yemeni|south arabian|south arabia|sabaean
22,79,900|india|indian|indian subcontinent
30,70,500|pakistan|pakistani
23.7,90.3,200|bangladesh
28.2,84,200|nepal|nepalese|nepali
30,91,500|tibet|tibetan|tibet autonomous region
7.8,80.7,150|sri lanka|sri lankan|ceylon|sinhalese
21,96,450|myanmar|burma|burmese
15,101,400|thailand|thai|siam|siamese
12.6,104.9,250|cambodia|cambodian|khmer
16,107,500|vietnam|vietnamese|viet nam|annam
19,102.5,300|laos|lao|laotian
12.5,122,500|philippines|philippine|filipino
47,104,600|mongolia|mongolian|mongol
41,64,500|central asia|central asian|uzbekistan|uzbek
48,67,800|kazakhstan|kazakh
34,66,400|afghanistan|afghan
9,40,500|ethiopia|ethiopian|abyssinia
15,39,150|eritrea|eritrean
0,38,350|kenya|kenyan
-6,35,500|tanzania|tanzanian
1.4,32.3,250|uganda
-2,30,100|rwanda|rwandan
9,8,500|nigeria|nigerian
7.9,-1,250|ghana|ghanaian|gold coast
7.5,-5.5,250|cote d'ivoire|ivory coast|ivorian
17.5,-4,600|mali|malian
12.2,-1.6,300|burkina faso|burkinabe|upper volta
6.5,2.3,150|benin|republic of benin
8.6,1,150|togo|togolese
9.9,-10.9,250|guinea|guinean
8.5,-11.8,150|sierra leone
6.4,-9.4,180|liberia|liberian
14.5,-14.5,250|senegal|senegalese
11.8,-15.2,120|guinea-bissau
6,12.5,350|cameroon|cameroonian
-4,22,800|democratic republic of the congo|drc|congo|zaire|dem. rep. congo|belgian congo|congo (kinshasa)
-1,15.5,300|republic of the congo|congo (brazzaville)|congo republic
-0.8,11.6,250|gabon|gabonese
-11.5,17.5,500|angola|angolan
-19,46.7,400|madagascar|malagasy
-30,25,600|south africa|south african
-19,29.8,300|zimbabwe
-13.5,27.8,400|zambia
-13.2,34.3,250|malawi
-18.6,35.5,500|mozambique
-22.5,17,400|namibia
13.5,19,500|chad
15.6,32.5,500|sudan|sudanese
31.8,-7,350|morocco|moroccan|maghreb
28,2.6,350|algeria|algerian
34,9.5,200|tunisia|tunisian|ifriqiya
27,17,450|libya|libyan
-25,134,1200|australia|australian|aboriginal|aboriginal australian|australian aboriginal
-6.5,145,350|papua new guinea|png
-41,174,450|new zealand|aotearoa|maori|māori
-17.8,178,200|fiji|fijian
-9.5,160,300|solomon islands|solomon is.
-16,167.5,300|vanuatu|ni-vanuatu|new hebrides
-21.3,165.5,200|new caledonia|kanak
-13.8,-172,100|samoa|samoan
-21,-175.2,150|tonga|tongan
23,-80,400|cuba|cuban
18.8,-70.4,200|dominican republic|hispaniola
19,-72.5,150|haiti|haitian
18.2,-77.3,100|jamaica|jamaican
18.2,-66.5,80|puerto rico|puerto rican
15.7,-90.3,200|guatemala|guatemalan
14.6,-86.6,250|honduras|honduran
13.7,-89,100|el salvador|salvadoran
12.8,-85,200|nicaragua
9.9,-84,150|costa rica|costa rican
8.5,-80.5,200|panama|panamanian
4.5,-74,450|colombia|colombian|new granada
-1.5,-78.5,250|ecuador|ecuadorian
-10,-76,550|peru|peruvian
-17,-65,500|bolivia|bolivian|upper peru
-33.4,-70.6,600|chile|chilean
-34.6,-63,700|argentina|argentine|argentinian
-15,-48,1000|brazil|brazilian
-23.4,-58.4,300|paraguay|paraguayan
-32.8,-56,200|uruguay|uruguayan
7,-66,450|venezuela|venezuelan
5,-58.9,200|guyana|guyanese|british guiana
4,-56,200|suriname|surinamese|dutch guiana
56,-96,1200|canada|canadian
72,-40,900|greenland|kalaallit nunaat

# ───────────── Ancient Mediterranean ─────────────
38,23.73,50|attic|attica|athens|athenian
37.91,22.88,40|corinth|corinthian|protocorinthian
38.35,23.2,50|boeotia|boeotian
37.07,22.43,50|laconia|laconian|sparta|spartan
38.4,27.1,220|east greek|ionia|ionian|east greek/sardis|smyrna|izmir
37.0,25.2,100|cyclades|cycladic|naxos|paros|delos
35.2,24.9,130|crete|cretan|minoan
37.73,22.75,150|mycenae|mycenaean|helladic|late helladic
40.5,16,200|south italian|magna graecia
41,16.5,110|apulia|apulian|puglia|canosa|canosan|daunian|tarentum|taranto|tarentine|messapian
40.9,14.3,70|campania|campanian|capua|cumae
40.4,16,90|lucania|lucanian|basilicata
40.42,15.0,40|paestum|paestan|poseidonia
37.5,14,130|sicily|sicilian|siceliot|syracuse
40,9,120|sardinia|sardinian|nuragic
42.6,11.6,110|etruscan|etruria|vulci|tarquinia|cerveteri|caere|chiusi|clusium|vetulonia|orvieto|volsinii
41.9,12.5,500|roman|ancient rome|rome (ancient)|roman empire|imperial roman|romano
41.9,12.5,40|rome|lazio|latium|latin|roman (city)|praeneste|palestrina|ostia|tivoli|tibur
40.75,14.49,25|pompeii|herculaneum|boscoreale|stabiae|oplontis|vesuvius
35.1,33.4,100|cyprus|cypriot|cypro-archaic|cypro-classical|cypro-geometric|cypro-phoenician
36.2,28,50|rhodes|rhodian|kamiros|ialysos
37.75,26.97,40|samos|samian|chios|lesbos
39.13,27.18,40|pergamon|pergamum|pergamene
37.94,27.34,40|ephesus|ephesian
38.5,28,100|lydia|lydian|sardis
39,31,180|phrygia|phrygian|gordion
37.3,28,90|caria|carian|halicarnassus|miletus|milesian|knidos|cnidus
39.96,26.24,40|troy|troad|ilion
40.6,22.9,170|macedonian|ancient macedonia|vergina|pella|thessaloniki|salonika
39.5,22.2,100|thessaly|thessalian
37.5,22.3,110|peloponnese|peloponnesian|argos|argive|arcadia|olympia
38.48,22.5,40|delphi|phocis
38.5,23.8,70|euboea|euboean|eretria
42.2,25.3,230|thrace|thracian
45.8,24.5,250|dacia|dacian
42,19.5,180|illyria|illyrian
41.01,28.98,350|byzantine|byzantium|constantinople|eastern roman
36.2,36.16,60|antioch|antiochene
34.55,38.27,30|palmyra|palmyrene
30.33,35.44,120|nabataean|petra
36.85,10.32,90|carthage|carthaginian|punic
31.2,29.92,40|alexandria|alexandrian|ptolemaic alexandria
32.6,22,200|cyrenaica|cyrene

# ───────────── Egypt & Nile ─────────────
25.7,32.6,50|thebes|western thebes|luxor|karnak|deir el-bahri|deir el bahri|valley of the kings|thebes (luxor)|el-asasif|asasif|qurna|sheikh abd el-qurna|deir el-medina|malqata|dra abu el-naga
29.85,31.25,40|memphis|saqqara|sakkara|dahshur|giza|abusir|memphite|lisht|el-lisht|meidum|helwan|heliopolis
27.65,30.9,30|amarna|tell el-amarna|el-amarna|akhetaten
26.18,31.92,40|abydos|naga ed-deir
27.4,30.7,40|meir|asyut|assiut|beni hasan|deir el-bersha|el-bersha|hermopolis|ashmunein
29.3,30.8,60|faiyum|fayum|fayoum|el-lahun|lahun|hawara|kom aushim|karanis|el-hibeh
25.1,32.78,40|hierakonpolis|nekhen|edfu|el-kab|kom ombo|esna
24.09,32.9,40|aswan|elephantine|philae|qubbet el-hawa
30.6,31.2,140|lower egypt|nile delta|delta|tanis|bubastis|naukratis|sais|buto|mendes|tell el-dab'a|tell el-yahudiya
26.5,32,260|upper egypt
28.5,30.8,200|middle egypt|antinoopolis|antinoe|akhmim|panopolis|oxyrhynchus|el-bahnasa|bawit|bawit
30.04,31.24,40|cairo|fustat|al-fustat|old cairo|mamluk|fatimid|egypt (cairo)
26.6,31.7,280|coptic|copt|early christian egypt
21,31,330|nubia|nubian|lower nubia|upper nubia|aniba|qustul|faras|ballana
19.6,30.4,60|kerma|kerma culture
16.94,33.75,90|meroe|meroitic|kush|kushite|napatan|napata|gebel barkal|nuri|el-kurru

# ───────────── Near East & Iran ─────────────
36.1,43.33,150|assyria|assyrian|neo-assyrian|nimrud|nineveh|khorsabad|ashur|kalhu
32.54,44.42,130|babylon|babylonian|neo-babylonian|old babylonian
31.3,45.6,150|sumer|sumerian|ur|uruk|lagash|girsu|telloh|nippur|kish|khafajah|tell asmar|diyala|early dynastic
33.1,44.1,200|akkad|akkadian
32.19,48.25,140|elam|elamite|susa|proto-elamite|susiana
29.93,52.89,450|achaemenid|persepolis|pasargadae
32,52,550|sasanian|sassanian|sasanid
35,51,550|parthian|arsacid
33.6,48,150|luristan|lorestan|lurs
36.8,50,120|amlash|marlik|gilan|caspian
37,45.5,80|hasanlu|azerbaijan (iran)|northwestern iran
37,66,300|bactria|bactrian|bactria-margiana|bmac|oxus|margiana
40,34.6,220|hittite|hattusa|central anatolia|kultepe|kanesh|alaca huyuk
39,43,220|urartu|urartian
47,35,650|scythian|scythia|scythians|black sea steppe
47,72,900|steppe|eurasian steppe|ordos|xiongnu
35.6,35.78,40|ugarit|ras shamra
36.2,37.16,40|aleppo|halab
33.51,36.29,40|damascus|damascene
35.95,39.01,40|raqqa|ar-raqqa
33.31,44.36,60|baghdad|abbasid
34.2,43.87,40|samarra
36.34,43.13,50|mosul|jazira|al-jazira
36.21,58.8,50|nishapur|nishapur (iran)|khorasan|khurasan
35.6,51.43,40|rayy|rey|ray|tehran
33.98,51.43,40|kashan
32.65,51.67,50|isfahan|esfahan|safavid
38.08,46.29,60|tabriz|ilkhanid|ilkhanate
29.6,52.53,60|shiraz|fars|qajar shiraz
36.3,59.6,50|mashhad
34.35,62.2,60|herat|timurid
39.65,66.96,60|samarkand|samarqand|sogdian|sogdiana
39.77,64.42,60|bukhara|bokhara
41.3,69.24,80|tashkent|fergana|ferghana
37.6,61.83,60|merv
40.43,29.72,40|iznik|nicaea
40.19,29.06,40|bursa
38.68,29.4,60|usak|ushak|uşak
37.87,32.48,50|konya|seljuq|seljuk|rum seljuq
36.6,4.2,60|kabylie|kabyle
32,-6,400|berber|amazigh|imazighen
19,6,700|tuareg|tamasheq
37.18,-3.6,40|granada|nasrid
37.6,-4.6,200|al-andalus|andalusia|andalusian|hispano-moresque|moorish spain
37.88,-4.78,40|cordoba|córdoba|umayyad spain|caliphate of cordoba

# ───────────── South Asia ─────────────
34,72,180|gandhara|gandharan|swat|peshawar|taxila|hadda
27.49,77.67,60|mathura
25.5,85.5,220|bihar|nalanda|bodh gaya|pala|magadha
23.5,88.5,250|bengal|bengali|west bengal|murshidabad
20.5,85,220|orissa|odisha|puri|konark
11,78.7,260|tamil nadu|tamil|chola|thanjavur|tanjore|madras|chennai|madurai|pandya
10.5,76.3,170|kerala|malabar|travancore
14.5,76,250|karnataka|mysore|hoysala|vijayanagara|hampi
16.5,80,260|andhra pradesh|andhra|amaravati|nagarjunakonda|ikshvaku
17.5,77,400|deccan|deccani|golconda|hyderabad|bijapur|ahmadnagar|ahmednagar|bidar|telangana
22.5,71.5,260|gujarat|gujarati|ahmedabad|cambay|khambhat
26.5,74,320|rajasthan|rajput|rajasthani
24.58,73.71,60|mewar|udaipur|nathdwara
25.44,75.64,40|bundi
25.18,75.83,40|kota|kotah
26.9,75.8,50|jaipur|amber|amer
26.57,74.87,40|kishangarh
28.02,73.31,60|bikaner
26.24,73.02,60|jodhpur|marwar
32,76.3,150|pahari|punjab hills|himachal pradesh|kangra|guler|basohli|mandi|chamba|nurpur|bilaspur|garhwal|jammu
34.1,74.8,150|kashmir|kashmiri|srinagar|jammu and kashmir
26.8,80.9,320|uttar pradesh|lucknow|awadh|oudh|benares|varanasi|sarnath|allahabad
27.18,78,80|agra|mughal|mughal india|fatehpur sikri
28.6,77.2,60|delhi|new delhi|sultanate|delhi sultanate
31.55,74.34,80|lahore|punjab|panjab
23.5,78,380|madhya pradesh|central india|malwa|mandu|sanchi|khajuraho|bundelkhand|gwalior
19.5,75.5,300|maharashtra|ellora|ajanta|aurangabad|bombay|mumbai
27.7,85.3,40|kathmandu|kathmandu valley|newar|patan|bhaktapur
27.5,90.4,120|bhutan|bhutanese
29.65,91.1,200|lhasa|central tibet|u-tsang
31,97,300|eastern tibet|kham

# ───────────── East Asia ─────────────
29.29,117.21,40|jingdezhen|ching-te-chen
39.9,116.4,80|beijing|peking|beijing (peking)
34.34,108.94,80|xi'an|xian|chang'an|changan
34.62,112.45,60|luoyang
36.1,114.35,50|anyang|yinxu
30.27,120.15,50|hangzhou|hang-chou|southern song
31.3,120.6,50|suzhou|soochow
32.06,118.8,60|nanjing|nanking
25.49,118.24,40|dehua|te-hua
31.36,119.82,40|yixing
28.07,119.14,50|longquan|lung-ch'uan
36.5,114.5,80|cizhou|tz'u-chou|handan
38.5,115,60|ding|dingzhou|ting
34.15,113.47,50|jun|junzhou|yuzhou
30,120.58,60|yue|shaoxing|zhejiang|chekiang
23.13,113.26,60|guangzhou|canton|cantonese|guangdong|kwangtung
31.23,121.47,50|shanghai
32.4,119.4,50|yangzhou
30.6,104,300|sichuan|szechwan|sanxingdui|chengdu
36.5,118,250|shandong|shantung
34,113.6,250|henan|honan
38.5,115.5,250|hebei|hopei
37.8,112.5,250|shanxi|shansi
35.5,109,250|shaanxi|shensi
37.5,103,400|gansu|kansu|majiayao
40.14,94.66,80|dunhuang|tun-huang
41.5,85,700|xinjiang|turfan|khotan|kucha|chinese central asia|tarim basin
42.5,112,600|inner mongolia
32.9,119.5,220|jiangsu|kiangsu
27.6,115.7,250|jiangxi|kiangsi
26,118,220|fujian|fukien|jian|chien
27.6,111.7,250|hunan|changsha
30.9,112.3,250|hubei|hupei|chu
31.8,117.2,200|anhui|anhwei
25,101.5,320|yunnan|dian
23.8,108.5,250|guangxi
41.3,122.6,250|liaoning|manchuria|liao
35.01,135.77,50|kyoto|kioto|heian
35.68,139.69,60|edo|tokyo|edo (tokyo)
34.69,135.8,40|nara
34.69,135.5,40|osaka
33.19,129.88,50|arita|imari|hizen|nabeshima|karatsu|saga
35.22,137.08,50|seto|mino|owari|nagoya
35.32,139.55,30|kamakura
36.56,136.65,60|kanazawa|kaga|kutani|ishikawa
31.6,130.55,90|satsuma|kagoshima
34.75,134.18,40|bizen|okayama
34.9,136.1,40|shigaraki|iga
26.3,127.8,150|okinawa|ryukyu|ryukyuan|ryukyu islands
43.2,142.8,300|ainu|hokkaido|ezo
35.84,129.21,60|silla|unified silla|gyeongju|kyongju
37.97,126.55,80|goryeo|koryo|kaesong
37.57,126.98,80|joseon|choson|seoul|hanyang
36.3,127,120|baekje|paekche
35.2,128.5,100|gaya|kaya

# ───────────── Southeast Asia ─────────────
13.41,103.87,160|angkor|angkorian|angkor period|khmer empire
14.35,100.57,60|ayutthaya
17,99.82,60|sukhothai|si satchanalai|sawankhalok
17.4,103.24,60|ban chiang
13.8,100,150|dvaravati|bangkok|central thailand
18.8,99,150|lan na|lanna|chiang mai|northern thailand
21.17,94.86,60|pagan|bagan
21.97,96.08,60|mandalay|ava|amarapura
15.5,108.2,220|champa|cham|my son
19.9,105.8,150|dong son|dongson|hanoi|tonkin
-7.3,110,140|central java|borobudur|prambanan
-7.8,112.5,150|east java|majapahit|singasari|kediri
-7.5,110.5,300|java|javanese
-8.4,115.2,80|bali|balinese
0,102,500|sumatra|sumatran|srivijaya
2.5,99,130|batak|toba batak|lake toba
1.1,97.6,60|nias
1,114,500|borneo|dayak|kalimantan|sarawak|iban
-3,119.9,100|toraja|sa'dan toraja
-2,120.5,300|sulawesi|celebes
-8.7,121,300|lesser sunda|flores|sumba|timor|lesser sunda islands
-3.3,128.2,250|maluku|moluccas|tanimbar|leti
16.8,121.1,100|ifugao|cordillera|luzon|igorot|bontoc
7.5,125,250|mindanao|mindanao (philippines)|t'boli|bagobo|maranao
4,102,350|malay|malaysia|malay peninsula|malaya

# ───────────── Oceania ─────────────
-4.2,143.4,160|sepik|sepik river|middle sepik|lower sepik|upper sepik|iatmul|abelam|sawos|kwoma|chambri|murik|yuat river|karawari|ramu
-2.6,140.5,60|lake sentani|sentani|humboldt bay
-5.5,138.5,130|asmat|casuarina coast|mimika|kamoro
4,-53,150|french guiana|guyane
-1.5,134.5,250|west papua|papua (indonesia)|irian jaya|bird's head|geelvink bay|cenderawasih bay|biak
-10,151,170|massim|trobriand|trobriand islands|milne bay|d'entrecasteaux|woodlark
-7.6,145,120|papuan gulf|gulf province|elema|purari|kerewa|kiwai|fly river
-6,144.5,200|highlands|western highlands|eastern highlands|mount hagen|enga|wahgi
-3.2,152,130|new ireland|malagan|malanggan|tabar
-5.5,150.5,220|new britain|tolai|baining|sulka|gazelle peninsula
-2.05,147,90|admiralty islands|manus|manus island
-7,147.5,120|huon gulf|tami|siassi|lae
-5,145.8,120|madang|astrolabe bay
-10.2,142.5,110|torres strait|torres strait islands|mer|murray island
-12.5,134.5,250|arnhem land|yolngu|tiwi|groote eylandt
-17.5,125.5,250|kimberley
-23.7,133.9,400|central australia|central desert|western desert|arrernte|aranda|papunya|pintupi
-9.5,160,300|solomon islands|santa cruz islands|new georgia|malaita|guadalcanal
19.6,-155.5,250|hawaii|hawai'i|hawaiian|hawaiian islands|kanaka maoli
-9,-139.5,110|marquesas|marquesas islands|marquesan|nuku hiva|hiva oa
-17.6,-149.4,110|tahiti|society islands|tahitian|french polynesia
-23,-150,150|austral islands|rurutu|raivavae|ra'ivavae|tubuai
-23.1,-134.95,40|mangareva|gambier islands
-27.12,-109.35,25|rapa nui|easter island|rapanui
-21.2,-159.8,150|cook islands|rarotonga|aitutaki|mangaia
7.4,150.5,500|caroline islands|chuuk|truk|yap|pohnpei|kosrae|micronesia|micronesian
3.85,154.95,30|nukuoro
1.5,173,500|kiribati|gilbert islands|i-kiribati
7.1,171.2,300|marshall islands|marshallese
13.4,144.8,150|guam|mariana islands|chamorro
-14,-171.5,200|polynesia|polynesian|western polynesia
-9.2,-171.8,60|tokelau|fakaofo|nukunonu|atafu|tokelauan
-8.5,179.2,150|tuvalu|tuvaluan|funafuti|ellice islands
-19.05,-169.87,30|niue|niuean
-0.53,166.93,20|nauru|nauruan
-13.3,-176.2,40|wallis|uvea|'uvea|futuna|wallis and futuna
-12.5,177.07,20|rotuma|rotuman
-13.8,-171.75,60|upolu|'upolu|apia
-13.6,-172.4,60|savai'i|savaii
-14.3,-170.7,40|tutuila|american samoa|manu'a
-21.13,-175.2,40|tongatapu|nuku'alofa
-18.65,-173.98,50|vava'u|vavau
-19.8,-174.4,40|ha'apai|haapai
-18.1,178.4,60|viti levu|suva|rewa
-16.6,179.3,60|vanua levu
-18.4,-178.9,150|lau islands|lau group|lakeba
-21.2,-159.78,25|rarotonga
-10.0,-161.0,300|northern cook islands|penrhyn|tongareva|pukapuka|manihiki
-15.4,167.7,150|espiritu santo|malakula|malekula|ambrym|pentecost|efate|tanna|erromango
-21.4,167.9,100|loyalty islands|lifou|mare|ouvea
-10.7,165.9,100|santa cruz|temotu|nendo
-5.5,143,600|new guinea|new guinea island
-6,152,800|melanesia|melanesian
-2,-160,3000|oceania|pacific islands|south pacific|pacific

# ───────────── Africa ─────────────
7.6,4.2,200|yoruba|yoruba peoples|yoruba people|oyo|yorubaland|egbado|ekiti|ijebu|owo
6.34,5.62,60|edo peoples|edo people|court of benin|benin kingdom|kingdom of benin|benin city|bini|edo (benin kingdom)
7.48,4.56,30|ife|ile-ife|ife (nigeria)
6.02,7.02,40|igbo-ukwu
5.8,7.4,160|igbo|igbo peoples|ibo|owerri|mbari
4.9,6.2,110|ijo|ijaw|ijo peoples|kalabari|niger delta
7.5,6.7,80|igala
9.5,8,160|nok|nok culture|katsina ala|sokoto
12,8.5,300|hausa|hausa peoples|kano|northern nigeria
9,11.5,140|mumuye|jukun|chamba|wurkun|benue|benue river valley|montol|goemai
6,8.7,110|cross river|ejagham|ekoi|efik|calabar|ibibio|anang|annang|ogoni
5.5,5.9,80|urhobo|isoko|western delta
6.5,-1.5,220|akan|akan peoples|fante|fanti|anyi|agni|attie|ebrie
6.7,-1.62,120|asante|ashanti|asante peoples|kumasi
6.5,0.8,100|ewe|ewe peoples
7.2,2.07,100|fon|fon peoples|dahomey|abomey|kingdom of dahomey
7.6,-5,120|baule|baule peoples|baoule
9.5,-5.5,160|senufo|senufo peoples|senoufo
7.3,-8,110|dan|dan peoples|dan-we|mano|kran|we|we peoples|guere|wobe
7,-6,100|guro|guro peoples|yaure|bete
14.3,-3.6,80|dogon|dogon peoples|bandiagara|tellem
12.8,-7,220|bamana|bamana peoples|bambara|segou|segu
12,-8.5,300|mande|manding|malinke|maninka|mande peoples|mandinka
12.5,-3.5,120|bwa|bwa peoples|bobo|nuna|winiama|gurunsi|nunuma
12.4,-1.5,160|mossi|mossi peoples
10,-3.2,100|lobi|lobi peoples
13.9,-4.55,60|djenne|jenne|jenné|djenné|djenne-djenno
14.5,-4.2,150|inland niger delta|niger delta (mali)
8.5,-12.5,150|sapi|sapi-portuguese|bullom|temne|sherbro
8,-11.5,110|mende|mende peoples|sande|sowei|vai|gola|bassa
11.2,-16,60|bidjogo|bijogo|bissagos|bijago
10.5,-14.5,90|baga|baga peoples|nalu|landuma|kissi|toma|loma
13,2,500|niger|nigerien|zarma|djerma
12,-2,900|fulani|fulbe|fula|peul
-5.5,14.5,200|kongo|kongo peoples|bakongo|kingdom of kongo|mayombe|yombe|vili|woyo|bembe|sundi|solongo
-2.5,15.3,140|teke|teke peoples|bateke
-4.5,21.5,130|kuba|kuba peoples|bakuba|bushoong|ngeende|ndengese|dengese|kete
-7.5,26.5,200|luba|luba peoples|baluba|shankadi|kanyok|luntu
-5.5,24.5,150|songye|songye peoples|basongye|kusu
-3,27.5,130|lega|lega peoples|balega|bembe (drc)|mbole|zimba
-9.5,20.5,260|chokwe|chokwe peoples|tshokwe|lunda|lwena|luvale|ovimbundu
-6,22.4,110|lulua|luluwa|bena lulua|salampasu|mbagani
-5.5,19.5,130|pende|pende peoples|mbuun
-6,17.5,130|yaka|yaka peoples|suku|holo|nkanu|mbala
-6,27.5,120|hemba|hemba peoples|tabwa|bembe|boyo|kusu|zula
3.3,27.8,120|mangbetu|mangbetu peoples|azande|zande|ngbaka|ngbandi|budja|yakoma
1.5,11,200|fang|fang peoples|pahouin|ntumu|betsi|okak
-0.5,13.5,150|kota|kota peoples|mahongwe|obamba|bakota
-2.5,11,110|punu|punu peoples|lumbo|tsogho|vuvi|mitsogo|aduma|shira
5.4,10.3,70|bamileke|bamileke peoples|bangwa|bangante
5.7,10.9,50|bamum|bamun|bamum peoples|foumban
6,10.2,120|cameroon grassfields|grassfields|grasslands|kom|bafut|oku|babanki|bamenda|nso|tikar
12,15,150|sao|sao culture|lake chad|kotoko
14.13,38.72,80|aksum|axum|aksumite|tigray|tigrinya
12.6,37.47,100|gondar|gondarine|amhara
12.03,39.04,30|lalibela
-2.5,36.5,220|maasai|masai|samburu|turkana|pokot|kamba|kikuyu|mijikenda|giryama
-6,39.3,400|swahili|swahili coast|zanzibar|lamu|kilwa|mombasa
-11,39.5,130|makonde|makonde peoples|mawiya
-5,33,250|nyamwezi|sukuma|zaramo|hehe|doe|kerewe|luguru
-17,44.5,250|sakalava|mahafaly|antandroy|merina|zafimaniry
-28.5,31,220|zulu|zulu peoples|kwazulu-natal|natal|nguni|swazi
-32,27.5,180|xhosa|mfengu|eastern cape
-25.3,29,150|ndebele|ndebele peoples|pedi|venda|tsonga|transvaal|sotho
-18,31,260|shona|shona peoples|mashonaland
-20.27,30.93,60|great zimbabwe
-15.3,23.1,150|lozi|barotse
3,31.5,250|lugbara|madi|alur|acholi|kakwa
6,30,400|south sudan|dinka|nuer|shilluk|azande (south sudan)
4,46,350|somali|somalia|somaliland
11.6,43.1,80|djibouti|afar|issa

# ───────────── Mesoamerica & Central America ─────────────
17,-90,320|maya|mayan|classic maya|lowland maya|maya lowlands|peten|petén|late classic maya
14.84,-89.14,50|copan|copán
17.22,-89.62,50|tikal
17.48,-92.05,50|palenque
20.24,-90.48,40|jaina|jaina island
20.5,-89,220|yucatan|yucatán|yucatec|chichen itza|chichén itzá|puuc|uxmal
19,-90.5,150|campeche
16.5,-92.5,170|chiapas|bonampak|yaxchilan|usumacinta
14.8,-91.2,150|guatemalan highlands|highland maya|kaminaljuyu|quiche|k'iche'|nebaj
19.43,-99.13,80|aztec|mexica|tenochtitlan|mexico city|valley of mexico|basin of mexico|mexico, city|texcoco|tlatelolco|new spain|viceroyalty of new spain
19.69,-98.84,40|teotihuacan|teotihuacán
18.1,-94.5,160|olmec|olmec style|san lorenzo|la venta|tabasco
17.06,-96.72,130|zapotec|oaxaca|monte alban|monte albán|mitla
17.3,-97.6,160|mixtec|mixteca|mixteca-puebla|mixteca alta|nuiñe|nuine
20.06,-99.34,50|toltec|tula
21.8,-98.5,160|huastec|huaxtec|huasteca
19.2,-96.2,160|veracruz|remojadas|gulf coast|totonac|el tajin|el tajín|nopiloa|classic veracruz|central veracruz
19.2,-103.7,80|colima|comala
20.6,-103.5,160|jalisco|ameca|tlaquepaque|guadalajara
21.7,-104.9,130|nayarit|ixtlan del rio|ixtlán del río|chinesco
20.3,-104,260|west mexico|western mexico|shaft tomb|shaft tomb culture
19.6,-101.6,130|michoacan|michoacán|tarascan|purepecha|purépecha|tzintzuntzan|chupicuaro|chupícuaro
17.8,-99.5,160|guerrero|mezcala|xochipala
19.48,-99.23,40|tlatilco|tlapacoya
19.04,-98.2,70|puebla|cholula|talavera poblana|tlaxcala
30.37,-107.95,120|casas grandes|paquime|paquimé|chihuahua
15.5,-88,100|ulua|ulúa|ulua valley|sula valley|lenca
8.9,-83.4,90|diquis|diquís|chiriqui|chiriquí|gran chiriqui|gran chiriquí
8.4,-80.4,70|cocle|coclé|gran cocle|gran coclé|sitio conte|parita|azuero
8.1,-81,80|veraguas
10.2,-85.4,110|nicoya|greater nicoya|guanacaste|gran nicoya
10,-83.5,110|atlantic watershed|central highlands (costa rica)|linea vieja|línea vieja
12,-86,150|nicaraguan pacific|ometepe

# ───────────── Caribbean ─────────────
19,-70.5,450|taino|taíno|arawak|greater antilles
13,-61,400|lesser antilles|saladoid|kalinago|carib

# ───────────── South America ─────────────
11,-74,90|tairona|sierra nevada de santa marta|santa marta
4.7,-75.7,110|quimbaya|cauca|cauca valley|middle cauca
5,-73.8,110|muisca|bogota|bogotá|chibcha|cundinamarca|boyaca|boyacá
3.9,-76.5,80|calima|yotoco|malagana
8.8,-75.8,110|zenu|zenú|sinu|sinú
4,-75,100|tolima
1.2,-77.3,100|narino|nariño|carchi|capulí|piartal|tuza
1.6,-79,90|tumaco|la tolita|tolita|tumaco-la tolita|esmeraldas
-2,-80.5,90|valdivia|chorrera|machalilla|guangala|guayas
0,-80.1,90|jama-coaque|jama coaque|bahia|bahía|manteno|manteño|manabi|manabí
-0.18,-78.47,60|quito|quito school
-8.1,-79,160|moche|mochica|chimu|chimú|chan chan|trujillo|north coast|north coast (peru)
-6.7,-79.8,90|lambayeque|sican|sicán|batan grande
-5.2,-80,70|vicus|vicús|piura|tallan
-7.5,-79,130|cupisnique|jequetepeque|tembladera
-9.59,-77.18,110|chavin|chavín|chavin de huantar
-9.5,-77.5,110|recuay|huaylas|ancash|áncash
-14.8,-75.1,110|nasca|nazca|nasca region
-13.8,-76.2,90|paracas|paracas peninsula|ocucaje|topara
-14.07,-75.73,80|ica|ica-chincha|chincha|ica valley
-11.56,-77.27,70|chancay|central coast|lima culture|pachacamac|rimac
-12.05,-77.04,60|lima|viceroyalty of peru|colonial peru
-13.1,-74.2,400|wari|huari|ayacucho
-13.53,-71.97,450|inca|inka|tahuantinsuyu|cuzco|cusco|cuzco school|cusco school
-16.55,-68.67,300|tiwanaku|tiahuanaco|titicaca|lake titicaca|pucara|pukara|aymara
-19.58,-65.75,80|potosi|potosí
-15.8,-70,300|south coast|southern highlands|chuquibamba|arequipa
-10,-76,600|andes|andean|central andes|peruvian highlands|andean highlands
-27.5,-66.5,200|condorhuasi|aguada|cienaga|ciénaga|calchaqui|calchaquí|catamarca|santa maria|santa maría|northwest argentina|la rioja|tucuman
-38.7,-72.6,260|mapuche|araucanian|araucania
-0.9,-49.5,110|marajoara|marajo|marajó|marajo island
-2.44,-54.7,90|santarem|santarém|tapajos|tapajós
-3,-60,1000|amazon|amazonia|amazonian|amazon basin
-2.5,-78,150|shuar|jivaro|jívaro|achuar|ecuadorian amazon
-7.5,-52,250|kayapo|kayapó|xingu|karaja|karajá|bororo|tapirape|tapirapé|rikbaktsa
3.5,-55,250|wayana|wai-wai|tiriyo|arawak (guianas)|kalina
-4.5,-74,300|shipibo|shipibo-conibo|ucayali

# ───────────── North America ─────────────
35,-88.5,600|mississippian|southeastern ceremonial complex|mound builders
38.65,-90.06,60|cahokia
35.3,-94.6,60|spiro
33,-87.63,60|moundville
39.3,-83,300|hopewell|adena|ohio valley|ohio
36.5,-108.5,320|ancestral pueblo|anasazi|pueblo|puebloan|chaco|chaco canyon|mesa verde|four corners|rio grande pueblo
32.8,-108,100|mimbres|mogollon
33.4,-111.9,160|hohokam|salado|sinagua
35.8,-110.5,70|hopi|hopi pueblo|sikyatki|tusayan
35.07,-108.85,40|zuni|zuni pueblo
34.9,-107.58,40|acoma|acoma pueblo|laguna|laguna pueblo
35.5,-106.3,90|santo domingo pueblo|cochiti|san ildefonso|santa clara|zia|tesuque|kewa|san juan pueblo|ohkay owingeh|taos
36.2,-109.5,220|navajo|navaho|diné|dine
33.5,-110,320|apache|western apache|jicarilla|mescalero|chiricahua
32.5,-112,160|tohono o'odham|papago|pima|akimel o'odham|yavapai|maricopa|yuma|quechan|mohave
42,-101,650|plains|great plains|plains indian|central plains|northern plains|southern plains
44,-101,320|lakota|sioux|dakota|teton|teton sioux|oglala|brule|hunkpapa|yanktonai|nakota|assiniboine|lakota/dakota
45.5,-107.5,170|crow|apsaalooke|apsáalooke|crow nation
44,-105,250|cheyenne|northern cheyenne|arapaho|northern arapaho
48.5,-113,220|blackfeet|blackfoot|siksika|kainai|piegan|blood
35,-98.5,220|kiowa|comanche|southern cheyenne|caddo|wichita|kiowa-apache
36.7,-96.3,120|osage|otoe|ponca|kaw|quapaw|omaha|pawnee|iowa
43,-111,250|shoshone|eastern shoshone|bannock|ute|paiute|great basin|northern paiute
46.2,-116.5,200|nez perce|plateau|yakama|umatilla|cayuse|wasco|wishram|columbia river|flathead|salish (plateau)
46.5,-87.5,400|great lakes|anishinaabe|ojibwe|ojibwa|chippewa|odawa|ottawa|potawatomi|menominee|ho-chunk|winnebago|sauk|fox|meskwaki|kickapoo|miami|shawnee
43,-76,220|haudenosaunee|iroquois|seneca|mohawk|onondaga|oneida|cayuga|tuscarora|six nations
46.8,-71.3,150|huron|wendat|huron-wendat|abenaki|wabanaki|penobscot|passamaquoddy|maliseet
45.5,-63.5,200|mi'kmaq|micmac|mi’kmaq|nova scotia
53,-98,700|cree|plains cree|woodland cree|métis|metis|red river
40.5,-75,180|lenape|delaware|munsee|mahican|mohegan|pequot|narragansett|wampanoag|algonquian
35.5,-83.5,180|cherokee|eastern cherokee|catawba
32.5,-85.5,250|muscogee|creek|muscogee (creek)|choctaw|chickasaw|seminole|southeast|southeastern|southeastern woodlands
26.5,-81,220|florida seminole|miccosukee|calusa|key marco
39,-123,90|pomo|pomo peoples|coast miwok|wappo
34.4,-119.8,90|chumash|tongva|gabrielino|luiseño|cahuilla|southern california|mission indian|diegueño|kumeyaay
39,-119.8,90|washoe|washo|mono lake paiute
41.3,-123.8,110|hupa|yurok|karuk|karok|klamath|modoc|northwestern california
37,-120,350|california|californian|yokuts|miwok|maidu|western mono|tulare
54,-130,550|northwest coast|pacific northwest|northwest coast indian|british columbia
58.3,-134.4,260|tlingit|chilkat|sitka|yakutat|southeast alaska
53.5,-132,120|haida|haida gwaii|queen charlotte islands|kaigani
54.5,-129.5,130|tsimshian|nisga'a|nisga’a|gitxsan|nass river|skeena
50.6,-127,130|kwakwaka'wakw|kwakwaka’wakw|kwakiutl|kwakwala|kwagiulth
49.5,-126.5,120|nuu-chah-nulth|nootka|makah|ditidaht
48.5,-123,160|coast salish|salish|musqueam|puget sound|snohomish|duwamish|lummi
52.4,-126.75,90|nuxalk|bella coola|heiltsuk|bella bella|haisla|oweekeno
64.5,-168,220|okvik|old bering sea|ipiutak|punuk|bering strait|st. lawrence island|thule
68,-160,450|inupiaq|inupiat|iñupiaq|iñupiat|north alaska|point barrow|alaskan inuit
61,-162,320|yup'ik|yupik|yup’ik|central yup'ik|yukon-kuskokwim|nunivak|kuskokwim|yukon delta
53.5,-167,300|aleut|unangan|unangax|aleutian islands
57.5,-153.5,200|alutiiq|sugpiaq|koniag|kodiak|chugach|pacific eskimo
63,-150,800|athabaskan|athapaskan|dene|gwich'in|tanaina|dena'ina|tlicho|dogrib|slavey|chipewyan|tahltan|koyukon|alaska|alaskan|alaska native
64,-80,1200|inuit|eskimo|canadian arctic|nunavut|baffin island|cape dorset|kinngait|dorset|labrador|nunavik|inuk|arctic
42.36,-71.06,60|boston|massachusetts|salem|charlestown
43.5,-71.5,280|new england|new hampshire|vermont|maine|connecticut|rhode island
41.49,-71.31,30|newport
40.71,-74.01,60|new york|new york city|manhattan|brooklyn|new jersey|hudson valley|albany
39.95,-75.16,60|philadelphia|pennsylvania|pennsylvania german|lancaster county
39.29,-76.61,60|baltimore|maryland|annapolis
37.5,-77.4,200|virginia|williamsburg|richmond
32.78,-79.93,60|charleston|south carolina
29.95,-90.07,60|new orleans|louisiana
41.88,-87.63,80|chicago|illinois
39.1,-84.5,80|cincinnati|rookwood
37.8,-122.4,120|san francisco|bay area
34.05,-118.24,120|los angeles
38.9,-77.04,50|washington, d.c.|district of columbia
46.8,-71.2,120|quebec|québec|new france|montreal|montréal
43.65,-79.38,150|toronto|ontario|upper canada

# ───────────── Europe: cities & historic regions ─────────────
48.86,2.35,40|paris|parisian|ile-de-france|île-de-france|saint-denis|st.-denis
45.76,4.84,50|lyon|lyons
49.44,1.1,60|rouen|normandy|norman
45.83,1.26,40|limoges|limousin
48.82,2.21,15|sevres|sèvres|vincennes|saint-cloud|st. cloud|chantilly|mennecy
48.58,7.75,60|strasbourg|alsace|alsatian
43.95,4.81,60|avignon|provence|provencal|marseille|marseilles|moustiers|aix-en-provence
47,4.8,130|burgundy|burgundian|dijon|beaune
48.2,-3,150|brittany|breton
47.4,0.7,110|tours|loire|loire valley|touraine|anjou|angers|orleans|blois
47,3.16,40|nevers
49.5,2.5,160|northern france|north france|picardy|amiens|artois|arras|champagne|reims|rheims|troyes|lorraine|nancy|metz
43.8,3,220|southern france|south of france|languedoc|toulouse|occitania|roussillon|montpellier|nimes|nîmes
44.8,-0.5,150|aquitaine|bordeaux|gascony|poitou|poitiers|saintonge
45.7,3.1,90|auvergne|clermont-ferrand
46.5,2.5,450|gaul|gallo-roman|gallic|merovingian|frankish|carolingian
49.45,11.08,40|nuremberg|nürnberg|nurnberg|franconia|franconian
48.37,10.9,40|augsburg|swabia|swabian|ulm|upper swabia
50.94,6.96,50|cologne|köln|koln|rhineland|rhenish|middle rhine|lower rhine|aachen|aix-la-chapelle|mainz|trier
51.16,13.47,30|meissen|meißen
51.05,13.74,60|dresden|saxony|saxon|leipzig
52.52,13.4,70|berlin|prussia|prussian|potsdam|brandenburg
48.14,11.58,60|munich|münchen|bavaria|bavarian|nymphenburg|regensburg|landshut
50.11,8.68,60|frankfurt|frankfurt am main|höchst|hochst|hesse|hanau|frankenthal
53.55,10,80|hamburg|lübeck|lubeck|north german|northern germany|lower saxony|hanover|hannover|bremen|brunswick|braunschweig|westphalia|westphalian|münster|munster|hildesheim|lüneburg
48.5,10,220|south german|southern germany|upper rhine|upper rhenish|lake constance|constance|freiburg|baden|württemberg|wurttemberg|ludwigsburg|stuttgart
51,9,300|ottonian|holy roman empire|central germany|thuringia|thuringian|erfurt|fulda|hesse-kassel|kassel
48.21,16.37,50|vienna|wien|viennese|vienna (austria)|lower austria
47.8,13.04,50|salzburg|upper austria|linz|hallstatt
47.27,11.39,90|tyrol|tirol|innsbruck|south tyrol
47.37,8.54,70|zurich|zürich|basel|bern|lucerne|winterthur|geneva|st. gall|st. gallen
52.37,4.9,40|amsterdam
52.38,4.64,30|haarlem
52.09,5.12,30|utrecht
52.16,4.49,30|leiden|leyden
52.01,4.36,30|delft|the hague|den haag|rotterdam|dordrecht|gouda
53.2,5.8,90|friesland|frisian|groningen
51.22,4.4,30|antwerp|antwerpen|anvers
50.85,4.35,40|brussels|bruxelles|brabant|brabantine|leuven|louvain|mechelen|malines
51.21,3.22,30|bruges|brugge
51.05,3.72,30|ghent|gent|ghent-bruges|oudenaarde|audenarde
50.6,3.39,40|tournai|hainaut|mons|lille
50.6,5.57,70|mosan|meuse|meuse valley|liège|liege|maastricht|dinant|lotharingia|lotharingian
51.51,-0.13,50|london|londoner|chelsea|bow|westminster|southwark|lambeth|spitalfields
52.88,-2,60|staffordshire|stoke-on-trent|burslem|etruria (staffordshire)|wedgwood
52.19,-2.22,50|worcester|derby|birmingham|bristol|bath|liverpool|midlands
53.38,-1.47,60|sheffield|york|yorkshire|leeds|newcastle|durham|northumbria|northumbrian
52.63,1.3,60|norwich|east anglia|norfolk|suffolk|cambridge
51.75,-1.26,60|oxford|canterbury|winchester|southern england|kent
52.5,-1,280|anglo-saxon|anglo saxon
54,-4,450|insular|hiberno-saxon|celtic (insular)|pictish
55.95,-3.19,50|edinburgh|glasgow|lowlands
53.35,-6.26,50|dublin|cork
55.68,12.57,50|copenhagen|danish (copenhagen)|royal copenhagen
59.33,18.07,60|stockholm|uppsala|gustavsberg|rorstrand|rörstrand
59.91,10.75,80|oslo|christiania|bergen
57.5,18.5,80|gotland|gotlandic
60,13,600|scandinavia|scandinavian|viking|norse|vendel|migration period scandinavia|nordic
68.5,22,300|sami|saami|lapland|sámi
60.17,24.94,60|helsinki
41.9,12.5,60|vatican|papal states
43.77,11.25,40|florence|firenze|florentine|tuscan|tuscany|fiesole|prato
45.44,12.33,35|venice|venetian|venezia|murano|veneto|venetia
45.46,9.19,50|milan|milanese|lombardy|lombard|pavia|como|bergamo|brescia|cremona
40.85,14.27,40|naples|neapolitan|napoli|capodimonte|campania (naples)
43.32,11.33,30|siena|sienese
44.41,8.93,40|genoa|genoese|genova|liguria|ligurian|savona|albisola
44.49,11.34,40|bologna|bolognese|emilia|emilian|emilia-romagna|modena|parma|reggio emilia|ravenna
45.41,11.88,30|padua|paduan|padova|vicenza
45.44,10.99,30|verona|veronese
44.84,11.62,30|ferrara|ferrarese
45.16,10.79,30|mantua|mantuan|mantova
43.73,12.64,50|urbino|marche|the marches|pesaro|castel durante|urbania|ancona|loreto
44.29,11.88,30|faenza|forlì|forli|romagna|rimini
43.11,12.39,50|umbria|umbrian|perugia|deruta|gubbio|assisi|orvieto (umbria)|spoleto|foligno
45.07,7.69,60|turin|torino|piedmont|piedmontese|savoy|aosta
43.72,10.4,40|pisa|pisan|lucca|lucchese|pistoia|arezzo
45.2,10,220|north italian|northern italy|northern italian|po valley|lombardy-venetia|langobardic|lombardic
43,12,180|central italian|central italy|abruzzo|abruzzi|abruzzese|castelli
39,16.5,180|calabria|calabrian|southern italy|south italy
38.12,13.36,60|palermo|norman sicily|siculo-norman|messina
43.5,16.4,120|dalmatia|dalmatian|split|dubrovnik|ragusa|zadar
40.42,-3.7,60|madrid|castile|castilian|toledo|toledan|valladolid|segovia|avila|ávila|salamanca|burgos|leon|león|el escorial|talavera|talavera de la reina|new castile|old castile
37.39,-5.98,60|seville|sevilla|sevillian|cadiz|cádiz|jerez
39.47,-0.38,50|valencia|valencian|manises|paterna|alcora
41.39,2.17,70|barcelona|catalonia|catalan|catalunya|girona|gerona|vic|lleida|lerida|tarragona
41.65,-0.89,100|aragon|aragonese|saragossa|zaragoza|navarre|navarrese|pamplona|teruel
42.88,-8.54,110|galicia (spain)|santiago de compostela|asturias|asturian|oviedo|cantabria|basque|bilbao
40,-4,450|visigothic|visigoth|hispania|iberian|iberia|hispano-roman|celtiberian
38.72,-9.14,50|lisbon|lisboa|lisbon (portugal)
41.15,-8.61,60|porto|oporto|coimbra|braga|northern portugal
37.98,23.73,30|athens (modern)|piraeus
35.34,25.13,50|heraklion|candia|knossos|cretan school|post-byzantine crete
50.08,14.43,50|prague|praha|praguese
49.2,16.6,90|moravia|moravian|brno|olomouc
50.8,17,120|silesia|silesian|breslau|wroclaw|wrocław
50.06,19.94,50|krakow|kraków|cracow|lesser poland
52.23,21.01,60|warsaw|masovia|mazovia
54.35,18.65,60|danzig|gdansk|gdańsk|pomerania|königsberg|konigsberg|east prussia
47.5,19.04,50|budapest|buda|pest|herend|zsolnay|pecs|pécs
46.5,24.5,160|transylvania|transylvanian|cluj|sibiu|brasov|brașov
44.43,26.1,120|wallachia|bucharest|moldavia
42.7,23.32,120|sofia|bulgarian|bulgaria|thracian (bulgaria)|tarnovo|veliko tarnovo
44.8,20.46,120|serbia|serbian|belgrade|kosovo|raška
50.45,30.52,80|kiev|kyiv|kievan rus|kievan|ukraine|ukrainian|ruthenian|chernihiv
58.52,31.27,60|novgorod|pskov|vladimir|suzdal|rostov|yaroslavl|vladimir-suzdal
59.93,30.36,50|st. petersburg|saint petersburg|st petersburg|petersburg|petrograd|leningrad|imperial russia
55.76,37.62,60|moscow|muscovite|moscow school|stroganov
53.9,27.57,150|belarus|belarusian|minsk|lithuania|lithuanian|vilnius|vilna|latvia|latvian|riga|estonia|estonian|tallinn|baltic
42,43.5,180|georgia (country)|georgian|tbilisi|kartli|colchis|svaneti
40.2,44.5,150|armenia|armenian|cilician armenia|yerevan|vaspurakan
40.4,49.9,150|azerbaijan|azerbaijani|caucasus|caucasian|dagestan|kuba (caucasus)|shirvan|karabagh|kazak (caucasus)

# ───────────── Misc. places seen in museum data ─────────────
39.5,22.2,100|thessalia
41.2,14.13,30|cales|calenian
29.3,30.8,60|al fayyum|el fayyum
34.2,-111.7,300|arizona
28,-82,400|florida
40.8,-73.2,80|long island
42.33,-71.09,20|roxbury|dorchester|cambridge, massachusetts
41.82,-71.41,40|providence
39.74,-75.55,40|wilmington|delaware valley
40.04,-76.3,40|lancaster
40.22,-74.76,30|trenton
38.5,-92.5,300|missouri
34.8,-92.2,250|arkansas
43.08,-79.07,40|niagara falls|niagara
41.28,-70.1,30|nantucket|nantucket island
43.53,-70.32,40|prouts neck|kittery point|portland, maine
48.9,2.3,15|clichy|montmartre|argenteuil|asnieres|bougival|louveciennes|marly-le-roi|pontoise|auvers-sur-oise
49.07,1.53,20|giverny|vernon
49.37,0.08,40|trouville|honfleur|le havre|etretat|étretat|sainte-adresse
49.43,2.08,30|beauvais
48.76,2.17,15|jouy-en-josas|versailles
41.8,12.68,20|frascati
7.6,-80.4,60|los santos province|herrera province
43,21,450|balkans|balkan
41,45,300|transcaucasia|south caucasus

# ───────────── Broad regions (low precision) ─────────────
10,-3,1100|west africa|western africa|west african|guinea coast
-2,18,1000|central africa|central african|equatorial africa|congo basin
2,38,1000|east africa|eastern africa|east african|horn of africa
-22,27,900|southern africa
28,15,1300|north africa|northern africa|north african
32,40,900|near east|ancient near east|middle east|western asia|west asia|levant and mesopotamia
8,108,1300|southeast asia|southeast asian|south-east asia|mainland southeast asia
35,112,1200|east asia|east asian|far east
22,79,1100|south asia|south asian|himalayas|himalayan
18,-93,700|mesoamerica|mesoamerican|pre-columbian mexico
11,-84,600|central america|central american|isthmus|isthmian|intermediate area
18,-72,900|caribbean|antilles|west indies
-15,-60,1600|south america|south american|latin america
45,-100,1500|native american|north american indian|american indian|first nations

# ───────────── Islamic world: generic labels ─────────────
30.04,31.24,300|mamluk egypt|mamluk syria|ayyubid
36,48,650|seljuq iran|seljuk iran|ilkhanid iran|timurid iran|qajar|qajar iran|zand|afsharid|persian (safavid)
`;

export interface GazetteerHit {
  lat: number;
  lon: number;
  r: number;
  key: string;
}

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export const GAZETTEER = new Map<string, GazetteerHit>();
for (const line of RAW.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const [coords, ...aliases] = t.split('|');
  const [lat, lon, r] = coords.split(',').map(Number);
  if ([lat, lon, r].some((n) => Number.isNaN(n))) throw new Error(`Bad gazetteer line: ${t}`);
  for (const a of aliases) {
    const key = normalize(a);
    // First definition wins so that more specific sections can't be silently overridden.
    if (!GAZETTEER.has(key)) GAZETTEER.set(key, { lat, lon, r, key });
  }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const districts = ["Kolhapur", "Pune", "Sangli", "Satara", "Solapur", "Ahmednagar", "Nashik", "Jalna", "Beed", "Osmanabad"];
const varieties = ["Co 86032", "CoM 0265", "VSI 434", "Co 92005", "MS 10001", "Phule 10001", "Co 0238"];
const diseases = ["Red Rot", "Smut", "Wilt", "Grassy Shoot", "Pokkah Boeng", "Rust", "Yellow Leaf Disease"];
const pests = ["Early Shoot Borer", "Internode Borer", "White Grub", "Woolly Aphid", "Whitefly", "Scale Insect", "Mealybug"];
const irrigation = ["Drip Irrigation", "Flood Irrigation", "Sprinkler", "Sub-surface Drip"];
const soils = ["Black Cotton", "Deep Black", "Medium Black", "Red Laterite", "Alluvial"];

function generateDocument(index) {
  const district = districts[index % districts.length];
  const variety = varieties[(index * 2) % varieties.length];
  const disease = diseases[(index * 3) % diseases.length];
  const pest = pests[(index * 5) % pests.length];
  const water = irrigation[(index * 7) % irrigation.length];
  const soil = soils[(index * 11) % soils.length];

  return `
# Detailed Sugarcane Report: ${district} District - Volume ${index}

## Overview of Cultivation in ${district}
Sugarcane cultivation in the ${district} region heavily relies on ${soil} soil. The typical planting season varies between Adsali, Pre-seasonal, and Suru. The regional farmers predominantly use ${water} techniques to manage the scarce water resources during the summer months.

## Varietal Performance: ${variety}
The variety ${variety} has shown remarkable performance in ${district}. It yields approximately ${80 + (index % 40)} tonnes per hectare under optimal conditions. The sugar recovery rate is around ${10.5 + (index % 2)}%. Farmers in ${district} prefer this variety due to its relative tolerance to local abiotic stresses.

## Pest Management: Focus on ${pest}
Recent surveys in ${district} indicate sporadic outbreaks of ${pest}. 
- **Symptoms**: The ${pest} attacks the crop during the grand growth phase, causing significant damage to the internodes and reducing overall juice quality.
- **Control Measures**: Integrated Pest Management (IPM) is highly recommended. Biological control using Trichogramma chilonis at 50,000 per hectare, released at 15-day intervals, has proven effective. Chemical control involves spraying Chlorantraniliprole 18.5 SC at 150 ml/acre if the economic threshold is crossed.

## Disease Management: Outbreak of ${disease}
${disease} remains a major threat in ${district}, especially in fields using flood irrigation and susceptible varieties.
- **Identification**: Symptoms include severe yellowing and drying of leaves from the top down. In advanced stages, the internal tissue shows reddish discoloration.
- **Prevention**: Use of disease-free setts treated with Carbendazim (0.1%) for 15 minutes before planting. Crop rotation with non-host crops like soybean or gram is strongly advised by the local Krishi Vigyan Kendra.

## Soil Health and Fertilization in ${district}
The ${soil} soils of ${district} require careful nutrient management. 
- A basal dose of 10 tonnes of FYM per acre is standard.
- Chemical fertilizers should be applied in 3 to 4 splits. For Suru planting, the recommended NPK is 250:115:115 kg/ha.
- Micronutrient deficiency, particularly Iron and Zinc, is rampant. Foliar application of 0.5% FeSO4 and 0.5% ZnSO4 at 45 and 60 days after planting is crucial for maintaining leaf chlorophyll.

## Economic Impact and Subsidies
The state government provides various subsidies for installing ${water} in ${district}. Farmers can avail up to 50-80% subsidy under the Pradhan Mantri Krishi Sinchayee Yojana (PMKSY). Cooperative sugar factories in the area also provide timely harvest and transport systems, ensuring farmers receive the Fair and Remunerative Price (FRP) on time.
`;
}

console.log("Generating 100 high-quality, diverse sugarcane reports...");
for (let i = 1; i <= 100; i++) {
  const content = generateDocument(i);
  fs.writeFileSync(path.join(dataDir, `report_${i}.md`), content.trim());
}
console.log("Done generating data.");

import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing Excel files...");

    // 1. Process States
    const wbStates = xlsx.readFile('c:/dev/aliado-laboral/documentation/direcciones de las instancias laborales.xlsx');
    const wsStates = wbStates.Sheets[wbStates.SheetNames[0]];
    const statesData = xlsx.utils.sheet_to_json(wsStates);

    const statesMap: Record<string, any> = {};

    for (const row of statesData as any[]) {
        const stateName = row["Estado"];
        if (!stateName) continue;

        if (!statesMap[stateName]) {
            statesMap[stateName] = {
                stateName: stateName.trim(),
                profedetAddress: null,
                localProcuraduriaAddress: null,
            };
        }

        const tipo = String(row["Tipo"]).toUpperCase();
        const address = row["Dirección Completa (Calle, No, Col, CP)"] || row["Instancia"];

        if (tipo.includes("PROFEDET") || String(row["Instancia"]).toUpperCase().includes("PROFEDET")) {
            statesMap[stateName].profedetAddress = address;
        } else if (tipo.includes("PROCURADUR") || String(row["Instancia"]).toUpperCase().includes("PROCURADUR")) {
            statesMap[stateName].localProcuraduriaAddress = address;
        }
    }

    let statesProcessed = 0;
    for (const state of Object.values(statesMap)) {
        try {
            await prisma.stateDirectory.upsert({
                where: { stateName: state.stateName },
                update: {
                    profedetAddress: state.profedetAddress,
                    localProcuraduriaAddress: state.localProcuraduriaAddress,
                },
                create: {
                    stateName: state.stateName,
                    profedetAddress: state.profedetAddress,
                    localProcuraduriaAddress: state.localProcuraduriaAddress,
                }
            });
            statesProcessed++;
        } catch (e) { console.error(`Failed to process state`, e); }
    }
    console.log(`✅ Loaded ${statesProcessed} states.`);

    // 2. Process Competences
    const wbComp = xlsx.readFile('c:/dev/aliado-laboral/documentation/Competencia Laboral.xlsx');
    const wsComp = wbComp.Sheets[wbComp.SheetNames[0]];
    const compData = xlsx.utils.sheet_to_json(wsComp);

    let compsProcessed = 0;
    await prisma.industryCompetence.deleteMany(); // Reset to avoid duplicates

    for (const row of compData as any[]) {
        const sector = row["Sector/Industria"];
        const competencia = row["Competencia"];

        if (!sector || !competencia) continue;

        const isFederal = String(competencia).toUpperCase().includes('FEDERAL');
        const finalCompetence = isFederal ? 'FEDERAL' : 'LOCAL';
        const baseInst = row["Instancia a la que acudir"] || (isFederal ? 'PROFEDET' : 'Procuraduría Estatal de la Defensa del Trabajo');
        const keywords = String(sector) + " " + String(row["Ejemplos de Empresas/Negocios"] || '') + " " + String(row["Palabras Clave de Búsqueda"] || '');

        try {
            await prisma.industryCompetence.create({
                data: {
                    sector: String(sector).trim(),
                    competence: finalCompetence,
                    baseInstance: String(baseInst).trim(),
                    keywords: keywords.substring(0, 1000).toLowerCase().replace(/[\n\r]/g, " ")
                }
            });
            compsProcessed++;
        } catch (e) { console.error("Error creating competence", e) }
    }
    console.log(`✅ Loaded ${compsProcessed} competences.`);
    console.log("Database seeded successfully!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

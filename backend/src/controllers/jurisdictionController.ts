import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper para normalizar cadenas (quitar acentos, minúsculas, limpiar espacios)
const normalizeString = (str: string) => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita acentos
        .replace(/[^a-z0-9\s]/g, "") // quita símbolos no alfanuméricos
        .trim();
};

export const getJurisdiction = async (req: Request, res: Response) => {
    try {
        const { sector_usuario, estado_usuario } = req.body;

        if (!sector_usuario || !estado_usuario) {
            return res.status(400).json({ error: "Se requiere 'sector_usuario' y 'estado_usuario'." });
        }

        const normalizedSector = normalizeString(sector_usuario);
        const inputTokens = normalizedSector.split(/\s+/); // dividir en palabras

        // 1. Obtener todas las competencias
        const competences = await prisma.industryCompetence.findMany();

        let matchedCompetence = null;
        let maxMatchScore = 0;

        // 2. Fuzzy Search simple por token y keyword
        for (const comp of competences) {
            const keywords = comp.keywords.split(',').map(normalizeString);
            const compSectorTokens = normalizeString(comp.sector).split(/\s+/);

            let score = 0;

            // Check against keywords
            for (const word of inputTokens) {
                if (word.length < 3) continue; // ignorar palabras muy cortas como 'de', 'la', 'en'

                // Exact match in keywords or sector name gains high points
                if (keywords.some((kw: string) => kw.includes(word)) || compSectorTokens.some((ct: string) => ct.includes(word))) {
                    score += 10;
                }

                // Very exact phrase match
                if (keywords.some(kw => kw === normalizedSector)) {
                    score += 50;
                }
            }

            if (score > maxMatchScore) {
                maxMatchScore = score;
                matchedCompetence = comp;
            }
        }

        // 3. Fallback strategy si no hay match
        if (!matchedCompetence) {
            // Por defecto, si no se encuentra match contundente, la mayoría va a LOCAL
            matchedCompetence = {
                sector: "Clasificación General / No Especificada",
                competence: "LOCAL",
                baseInstance: "Procuraduría Estatal de la Defensa del Trabajo",
            };
        }

        // 4. Buscar el Estado en el Directorio
        const stateNormalized = normalizeString(estado_usuario);
        const states = await prisma.stateDirectory.findMany();

        // Find best state match
        let matchedState = states.find((s: any) => normalizeString(s.stateName).includes(stateNormalized) || stateNormalized.includes(normalizeString(s.stateName)));

        if (!matchedState) {
            return res.status(404).json({
                error: "Estado no encontrado en el directorio.",
                details: "Asegúrate de escribir el nombre del estado completo (ej. 'Ciudad de México', 'Jalisco')."
            });
        }

        // 5. Determinar la dirección exacta basada en competencia
        let officialInstanceName = "";
        let officialAddress = "";
        let instructions = "";

        if (matchedCompetence.competence === 'FEDERAL') {
            officialInstanceName = matchedCompetence.baseInstance || "PROFEDET (Federal)";
            officialAddress = matchedState.profedetAddress || "Dirección no registrada. Consulta en línea para PROFEDET de tu estado.";
            instructions = "Dirígete a la instancia Federal (PROFEDET). Dado el sector en el que trabajas, tu asunto es de jurisdicción federal.";
        } else {
            officialInstanceName = matchedCompetence.baseInstance || "Procuraduría de la Defensa del Trabajo (Local)";
            officialAddress = matchedState.localProcuraduriaAddress || "Dirección no registrada. Consulta la Procuraduría Local de tu estado.";
            instructions = "Dirígete a la instancia Local. Tu asunto se resuelve en el fuero común del Estado correspondiente.";
        }

        // 6. JSON de Respuesta Final
        return res.json({
            matchEncontrado: maxMatchScore > 0,
            analisis: {
                palabraBuscada: sector_usuario,
                sectorIdentificado: matchedCompetence.sector,
                competencia: matchedCompetence.competence
            },
            recomendacion: {
                instancia: officialInstanceName,
                direccionOficial: officialAddress,
                indicaciones: instructions
            }
        });

    } catch (error) {
        console.error("Jurisdiction Error:", error);
        return res.status(500).json({ error: "Error procesando la solicitud de jurisdicción." });
    }
};

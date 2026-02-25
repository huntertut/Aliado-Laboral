-- Directorio de Estados (Oficinas y Tribunales)
CREATE TABLE IF NOT EXISTS "StateDirectory" (
    "id" SERIAL PRIMARY KEY,
    "stateName" VARCHAR(255) NOT NULL UNIQUE,
    "profedetAddress" TEXT,
    "localProcuraduriaAddress" TEXT,
    "federalConciliationAddress" TEXT,
    "localConciliationAddress" TEXT,
    "federalTribunalAddress" TEXT,
    "localTribunalAddress" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Matriz de Competencias e Industrias (Keywords para Fuzzy Search)
CREATE TABLE IF NOT EXISTS "IndustryCompetence" (
    "id" SERIAL PRIMARY KEY,
    "sector" VARCHAR(255) NOT NULL,
    "competence" VARCHAR(50) NOT NULL CHECK ("competence" IN ('FEDERAL', 'LOCAL')),
    "baseInstance" VARCHAR(255) NOT NULL,
    "keywords" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ejemplos de Seed
INSERT INTO "StateDirectory" ("stateName", "profedetAddress", "localProcuraduriaAddress") VALUES
('Ciudad de México', 'Dr. José María Vértiz 211, Doctores, CDMX', 'San Antonio Abad 122, Tránsito, CDMX'),
('Jalisco', 'Palacio Federal, Av. Alcalde 500, Guadalajara', 'Av. Las Palmas 96, La Aurora, Guadalajara'),
('Nuevo León', 'Zaragoza 1000 Sur, Monterrey', 'Churubusco 495, Monterrey')
ON CONFLICT DO NOTHING;

INSERT INTO "IndustryCompetence" ("sector", "competence", "baseInstance", "keywords") VALUES
('Industria Textil', 'FEDERAL', 'PROFEDET', 'fábrica de telas, maquila textil, costura industrial, hilos'),
('Restaurantes y Servicios de Alimentos', 'LOCAL', 'Procuraduría Estatal de la Defensa del Trabajo', 'restaurante, mesero, cocinero, bar, cafetería, fonda, comida, chef'),
('Industria Automotriz y Autopartes', 'FEDERAL', 'PROFEDET', 'armadora de autos, autopartes, fábrica de coches, ensamble automotriz, mecánico industrial, chevrolet, nissan')
ON CONFLICT DO NOTHING;

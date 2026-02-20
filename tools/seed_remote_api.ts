import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001'; // DigitalOcean Production IP

const users: any[] = [
    {
        email: 'worker_free@test.com',
        password: '123456',
        fullName: 'Trabajador Gratuito',
        role: 'worker',
        // Plan logic usually handled after register, but we rely on defaults for now
    },
    {
        email: 'worker_premium@test.com',
        password: '123456',
        fullName: 'Trabajador Premium',
        role: 'worker',
        isAdminSetup: true, // Hint to backend if supported, otherwise manually upgrade later
        plan: 'premium'
    },
    {
        email: 'lawyer_basic@test.com',
        password: '123456',
        fullName: 'Abogado Plan Basico',
        role: 'lawyer',
        extraData: {
            licenseNumber: 'LBASIC001',
            specialty: 'Laboral',
            plan: 'basic'
        }
    },
    {
        email: 'lawyer_pro@test.com',
        password: '123456',
        fullName: 'Abogado Plan Pro',
        role: 'lawyer',
        extraData: {
            licenseNumber: 'LPRO001',
            specialty: 'Corporativo',
            plan: 'pro'
        }
    },
    {
        email: 'pyme_basic@test.com',
        password: '123456',
        fullName: 'Pyme Básica SA',
        role: 'pyme',
        extraData: {
            companyName: 'Pyme Básica SA',
            rfc: 'XAXX010101000',
            subscriptionLevel: 'basic'
        }
    },
    {
        email: 'pyme_premium@test.com',
        password: '123456',
        fullName: 'Pyme Premium SC',
        role: 'pyme',
        extraData: {
            companyName: 'Pyme Premium SC',
            rfc: 'XAXX010101001',
            subscriptionLevel: 'premium'
        }
    },
    {
        email: 'admin@test.com',
        password: '123456',
        fullName: 'Admin General',
        role: 'admin'
    },
    {
        email: 'supervisor@test.com',
        password: '123456',
        fullName: 'Supervisor Legal',
        role: 'supervisor'
    },
    {
        email: 'contador@test.com',
        password: '123456',
        fullName: 'Contador General',
        role: 'accountant'
    }
];

const seed = async () => {
    console.log(`🌱 Seeding remote DB at ${API_URL}...`);

    for (const user of users) {
        try {
            console.log(`Attempting to register: ${user.email} (${user.role})...`);

            // 1. Register
            try {
                await axios.post(`${API_URL}/auth/register`, {
                    email: user.email,
                    password: user.password,
                    fullName: user.fullName,
                    role: user.role,
                    ...user.extraData
                });
                console.log(`✅ Registered: ${user.email}`);
            } catch (regError: any) {
                if (regError.response?.status === 400 && regError.response?.data?.error?.includes('already exists')) {
                    console.log(`⚠️ Already exists: ${user.email}`);
                } else {
                    console.error(`❌ Failed to register ${user.email}:`, regError.message, regError.response?.data);
                    continue; // Skip next steps if register failed drastically
                }
            }

            // 2. Upgrade Plans (Hack: Login and Update Profile if possible, or assume backend defaults)
            if (user.role === 'lawyer' && user.extraData?.plan) {
                // Note: Real plan upgrade usually implies payment webhook. 
                // For now, these users will exist but might be in 'free' state until manually updated in DB.
                // However, at least they WON'T 404 anymore.
            }

        } catch (e: any) {
            console.error(`❌ Error processing ${user.email}:`, e.message);
        }
    }

    console.log('🏁 Seeding script finished.');
};

seed();


import { fetchLaborNews } from '../services/newsScheduler';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔄 Triggering Manual News Fetch...');
fetchLaborNews().then(() => {
    console.log('🏁 Manual Fetch Complete.');
});

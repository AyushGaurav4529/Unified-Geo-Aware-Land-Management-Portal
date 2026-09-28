require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sih_land_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const seedParcels = async () => {
    console.log("Seeding ~200 parcels around Tumkur, Karnataka...");
    try {
        const statuses = ['Pending', 'Under Acquisition', 'Acquired', 'Disputed', 'Compensated'];
        const landUses = ['Agricultural', 'Commercial', 'Residential', 'Industrial'];
        
        // Tumkur approx coords: 13.33, 77.10
        let valuesStr = [];
        
        for (let i = 1; i <= 200; i++) {
            const surveyNo = `123/${i + 10}`;
            const area = (Math.random() * 5 + 0.5).toFixed(2);
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const use = landUses[Math.floor(Math.random() * landUses.length)];
            
            // Generate a small polygon near Tumkur
            const lat = 13.33 + (Math.random() - 0.5) * 0.1;
            const lng = 77.10 + (Math.random() - 0.5) * 0.1;
            const p1 = `${lng} ${lat}`;
            const p2 = `${lng + 0.001} ${lat}`;
            const p3 = `${lng + 0.001} ${lat + 0.001}`;
            const p4 = `${lng} ${lat + 0.001}`;
            const geom = `ST_GeomFromText('POLYGON((${p1}, ${p2}, ${p3}, ${p4}, ${p1}))', 4326)`;
            
            valuesStr.push(`('${surveyNo}', ${area}, 'Shivapura', 'Tumkur', 'Karnataka', '${use}', '${status}', 'Owner ${i}', ${geom})`);
        }
        
        const query = `
            INSERT INTO parcels (survey_no, area_acres, village, district, state, land_use, status, owner_name, geom)
            VALUES ${valuesStr.join(', ')}
        `;
        
        await pool.query(query);
        console.log("Successfully seeded 200 parcels.");
    } catch (err) {
        console.error("Error seeding parcels:", err);
    } finally {
        pool.end();
    }
};

seedParcels();

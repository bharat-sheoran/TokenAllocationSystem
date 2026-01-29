import axios from 'axios';

const API = 'http://localhost:8080/api';

/* ------------------------
   BASIC HTTP HELPERS
------------------------- */

async function post(url: string, body: any) {
    const res = await axios.post(url, body);
    return res.data;
}

async function get(url: string) {
    const res = await axios.get(url);
    return res.data;
}

const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

/* ------------------------
   CREATE ENTITIES
------------------------- */

async function createDoctor(name: string, specialization: string) {
    await sleep(200);
    return post(`${API}/admin/doctors`, { name, specialization });
}

async function createEmployee(name: string) {
    await sleep(200);
    return post(`${API}/admin/employees`, { name });
}

async function createSlot(
    doctorId: string,
    date: string,
    start: string,
    end: string
) {
    await sleep(200);
    return post(`${API}/slots`, {
        doctorId,
        slotDate: date,
        startTime: start,
        endTime: end,
        hardCapacity: 3,
    });
}

async function requestToken(payload: any) {
    await sleep(200);
    return post(`${API}/tokens`, payload);
}

async function emergencyToken(payload: any) {
    await sleep(200);
    return post(`${API}/tokens/emergency`, payload);
}

async function cancelToken(tokenId: string) {
    await sleep(200);
    return post(`${API}/tokens/${tokenId}/cancel`, {});
}

async function markNoShow(tokenId: string) {
    await sleep(200);
    return post(`${API}/tokens/${tokenId}/no-show`, {});
}

async function viewSlot(slotId: string) {
    await sleep(200);
    return get(`${API}/tokens/slot/${slotId}`);
}

/* ------------------------
   OPD DAY SIMULATION
------------------------- */

async function simulateOpdDay() {
    console.log('\n🏥 OPD DAY SIMULATION STARTED\n');

    /* ------------------------
       1️⃣ CREATE DOCTORS
    ------------------------- */
    const doctors = [];
    const doctorData = [
        { name: 'Dr. A', specialization: 'Surgery' },
        { name: 'Dr. B', specialization: 'Fever' },
        { name: 'Dr. C', specialization: 'Critical' },
    ];
    for (const { name, specialization } of doctorData) {
        const d = await createDoctor(name, specialization);
        doctors.push({ doctorId: d.id, slots: [] as string[] });
    }

    console.log('✅ Doctors created');

    /* ------------------------
       2️⃣ CREATE EMPLOYEES
    ------------------------- */
    await createEmployee('Receptionist 1');
    await createEmployee('Receptionist 2');

    console.log('✅ Employees created');

    /* ------------------------
       3️⃣ CREATE SLOTS
    ------------------------- */
    const date = '2026-01-30';

    for (const doc of doctors) {
        const morning = await createSlot(doc.doctorId, date, '09:00', '10:00');
        const afternoon = await createSlot(doc.doctorId, date, '13:00', '14:00');
        const evening = await createSlot(doc.doctorId, date, '17:00', '18:00');

        doc.slots.push(morning.id, afternoon.id, evening.id);
    }

    console.log('✅ Slots created (Morning / Afternoon / Evening)');

    /* ------------------------
       4️⃣ BEST CASE SCENARIO
       (Smooth Online Bookings)
    ------------------------- */
    console.log('\n🌤️ BEST CASE: Smooth Online Flow');

    for (const doc of doctors) {
        for (const slotId of doc.slots) {
            for (let i = 0; i < 2; i++) {
                await requestToken({
                    name: `Patient_${doc.doctorId}_${i}`,
                    doctorId: doc.doctorId,
                    slotId,
                    source: 'ONLINE',
                    paymentStatus: 'PAID',
                });
            }
        }
    }

    console.log('✅ Best-case bookings completed');

    /* ------------------------
       5️⃣ WORST CASE SCENARIO
       (Overbooking + Chaos)
    ------------------------- */
    console.log('\n🌪️ WORST CASE: Overbooking & Chaos');

    const chaoticTokens: string[] = [];

    for (const doc of doctors) {
        const slotId = doc.slots[0];

        // Overbook slot
        for (let i = 0; i < 5; i++) {
            const t = await requestToken({
                name: `Overbook_${i}`,
                doctorId: doc.doctorId,
                slotId,
                source: 'WALK_IN',
                paymentStatus: 'UNPAID',
            });
            chaoticTokens.push(t.id);
        }
    }

    console.log('⚠️ Overbooking done');

    /* ------------------------
       6️⃣ CANCELLATIONS
    ------------------------- */
    await cancelToken(chaoticTokens[1]);
    await cancelToken(chaoticTokens[3]);

    console.log('❌ Cancellations processed');

    /* ------------------------
       7️⃣ NO-SHOW
    ------------------------- */
    await markNoShow(chaoticTokens[2]);

    console.log('🚫 No-show processed');

    /* ------------------------
       8️⃣ EMERGENCY INSERTION
    ------------------------- */
    const emergency = await emergencyToken({
        name: 'Emergency Patient',
        doctorId: doctors[0].doctorId,
        slotId: doctors[0].slots[0],
        source: 'EMERGENCY',
        paymentStatus: 'WAIVED',
    });

    console.log('🚑 Emergency token inserted:', emergency.id);

    /* ------------------------
       9️⃣ FINAL SLOT STATE
    ------------------------- */
    console.log('\n📊 FINAL SLOT STATE');

    for (const doc of doctors) {
        for (const slotId of doc.slots) {
            const tokens = await viewSlot(slotId);
            console.log(`\nDoctor ${doc.doctorId} | Slot ${slotId}`);
            tokens.forEach((t: any) =>
                console.log(
                    `  #${t.sequenceNumber} | ${t.status} | ${t.source}`
                )
            );
        }
    }

    console.log('\n🏁 OPD DAY SIMULATION COMPLETED\n');
}

simulateOpdDay().catch(console.error);

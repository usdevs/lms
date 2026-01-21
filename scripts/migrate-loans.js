
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Updating existing loans to COMPLETED...');

    const requests = await prisma.loanRequest.updateMany({
        where: {},
        data: { requestStatus: 'COMPLETED' },
    });
    console.log(`Updated ${requests.count} loan requests.`);

    const details = await prisma.loanItemDetail.updateMany({
        where: {},
        data: { loanStatus: 'RETURNED' },
    });
    console.log(`Updated ${details.count} loan item details.`);
}

// Restore stock for ON_LOAN items before marking them returned
async function correctStock() {
    const onLoanItems = await prisma.loanItemDetail.findMany({
        where: { loanStatus: 'ON_LOAN' }
    });

    console.log(`Found ${onLoanItems.length} items ON_LOAN. Restoring stock...`);

    for (const loanItem of onLoanItems) {
        await prisma.item.update({
            where: { itemId: loanItem.itemId },
            data: { itemQty: { increment: loanItem.loanQty } }
        });
    }
}

main()
    .then(async () => {
        await correctStock();
        // Re-run to ensure all marked as returned
        await prisma.loanRequest.updateMany({ data: { requestStatus: 'COMPLETED' } });
        await prisma.loanItemDetail.updateMany({ data: { loanStatus: 'RETURNED' } });
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

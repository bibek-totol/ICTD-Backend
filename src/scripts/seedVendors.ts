import { prisma } from "../configs/prisma.config";

const vendors = [
  {
    name: "JV of Optimal IT Ltd; Savvy Techmart Ltd and LAL Sobuz Technology",
    address: "4/16 Humayun Road (3rd Floor), Mohammadpur, Dhaka-1207",
    phone: "01711-588054",
    serial: 1,
    isActive: true,
  },
  {
    name: "JV of IBCS-Primax Software (Bangladesh) Ltd, Leads Training & Consulting Ltd and Virtual Market Solution Ltd",
    address: "House- 6/2 (Level 4 & 6), Kazi Nazrul Islam Road, Block-F, Dhaka-1207",
    phone: "01713-397560",
    serial: 2,
    isActive: true,
  },
  {
    name: "DataSoft Systems Bangladesh Ltd",
    address: "House-11, Road-113/A, Gulshan-2, Dhaka-1212",
    phone: "01712-445566",
    serial: 3,
    isActive: true,
  },
  {
    name: "Southtech Limited",
    address: "Rangs Pearl Tower, Mohakhali, Dhaka-1212",
    phone: "01715-998877",
    serial: 4,
    isActive: true,
  },
  {
    name: "Tiger IT Bangladesh Ltd",
    address: "Rangs Bhaban, Gulshan-1, Dhaka-1212",
    phone: "01718-223344",
    serial: 5,
    isActive: true,
  },
  {
    name: "Dream71 Bangladesh Ltd",
    address: "Banani DOHS, Dhaka-1206",
    phone: "01719-667788",
    serial: 6,
    isActive: true,
  },
];

async function main() {
  for (const vendor of vendors) {
    const existing = await prisma.vendor.findFirst({
      where: {
        name: vendor.name,
        phone: vendor.phone,
      },
    });

    if (existing) {
      await prisma.vendor.update({
        where: { id: existing.id },
        data: {
          address: vendor.address,
          serial: vendor.serial,
          isActive: vendor.isActive,
        },
      });
    } else {
      await prisma.vendor.create({ data: vendor });
    }
  }

  console.log(`Seeded ${vendors.length} vendor records`);
}

main()
  .catch((error) => {
    console.error("Vendor seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

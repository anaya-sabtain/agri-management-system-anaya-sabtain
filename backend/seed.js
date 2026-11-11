require("dotenv").config();

const sequelize = require("./config/db");
const {
  User,
  Crop,
  Inventory,
  Buyer,
  Worker,
  Order,
  Task,
  Expense,
  Attendance,
  Equipment,
  Maintenance,
} = require("./models");

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // Step 1: Find or create Admin
    let admin = await User.findOne({
      where: { email: "admin@agri.com" },
    });

    if (!admin) {
      admin = await User.create({
        fullName: "System Administrator",
        username: "admin",
        email: "admin@agri.com",
        password: process.env.ADMIN_PASSWORD,
        role: "admin",
      });

      console.log("Admin account created.");
    } else {
      console.log("Admin account already exists.");
    }

    // Step 2: Sample crop data
    const crops = [
      {
        name: "Wheat",
        field: "Field A",
        plantingDate: "2026-11-01",
        cuttingDate: "2027-04-15",
        healthScore: 95,
        expectedQty: 500,
        harvestQty: 0,
        createdBy: admin.id,
      },
      {
        name: "Rice",
        field: "Field B",
        plantingDate: "2026-07-01",
        cuttingDate: "2026-11-20",
        healthScore: 88,
        expectedQty: 400,
        harvestQty: 0,
        createdBy: admin.id,
      },
      {
        name: "Sugarcane",
        field: "Field C",
        plantingDate: "2026-03-01",
        cuttingDate: "2027-02-15",
        healthScore: 92,
        expectedQty: 800,
        harvestQty: 0,
        createdBy: admin.id,
      },
    ];

    for (const cropData of crops) {
      const [crop, created] = await Crop.findOrCreate({
        where: {
          name: cropData.name,
          field: cropData.field,
        },
        defaults: cropData,
      });

      console.log(
        created
          ? `Crop created: ${crop.name}`
          : `Crop already exists: ${crop.name}`
      );
    }

    console.log("Crop seeding completed successfully.");

    // Step 3: Sample inventory data
    const inventoryItems = [
      {
        item: "Urea",
        type: "Fertilizer",
        qty: 200,
        minQty: 50,
        unit: "kg",
      },
      {
        item: "DAP",
        type: "Fertilizer",
        qty: 150,
        minQty: 40,
        unit: "kg",
      },
      {
        item: "Wheat Seeds",
        type: "Seed",
        qty: 100,
        minQty: 25,
        unit: "kg",
      },
      {
        item: "Pesticide",
        type: "Pesticide",
        qty: 15,
        minQty: 20,
        unit: "liter",
      },
    ];

    for (const itemData of inventoryItems) {
      const [item, created] = await Inventory.findOrCreate({
        where: {
          item: itemData.item,
        },
        defaults: itemData,
      });

      console.log(
        created
          ? `Inventory created: ${item.item}`
          : `Inventory already exists: ${item.item}`
      );
    }

    console.log("Inventory seeding completed successfully.");

    // Step 4: Sample buyers
    const wheatCrop = await Crop.findOne({
      where: { name: "Wheat", field: "Field A" },
    });

    const riceCrop = await Crop.findOne({
      where: { name: "Rice", field: "Field B" },
    });

    const buyers = [
      {
        name: "Ali Traders",
        cnic: "35202-1234567-1",
        cropId: wheatCrop.id,
        quantity: 50,
        date: "2026-11-10",
      },
      {
        name: "Ahmed Agriculture",
        cnic: "35202-7654321-2",
        cropId: riceCrop.id,
        quantity: 30,
        date: "2026-11-10",
      },
    ];

    for (const buyerData of buyers) {
      const [buyer, created] = await Buyer.findOrCreate({
        where: { cnic: buyerData.cnic },
        defaults: buyerData,
      });

      console.log(
        created
          ? `Buyer created: ${buyer.name}`
          : `Buyer already exists: ${buyer.name}`
      );
    }

    // Step 5: Sample workers
    const workers = [
      {
        fullName: "Muhammad Usman",
        cnic: "35202-1111111-1",
        phone: "03001234567",
        role: "Field Worker",
        dailyWage: 1500,
        joinDate: "2026-01-10",
        status: "Active",
      },
      {
        fullName: "Muhammad Bilal",
        cnic: "35202-2222222-2",
        phone: "03011234567",
        role: "Machine Operator",
        dailyWage: 2000,
        joinDate: "2026-02-15",
        status: "Active",
      },
      {
        fullName: "Muhammad Hamza",
        cnic: "35202-3333333-3",
        phone: "03021234567",
        role: "Supervisor",
        dailyWage: 2500,
        joinDate: "2026-03-01",
        status: "Inactive",
      },
    ];

    for (const workerData of workers) {
      const [worker, created] = await Worker.findOrCreate({
        where: { cnic: workerData.cnic },
        defaults: workerData,
      });

      console.log(
        created
          ? `Worker created: ${worker.fullName}`
          : `Worker already exists: ${worker.fullName}`
      );
    }

    console.log("Buyers and workers seeding completed.");

    // Step 6: Sample orders
    const orders = [
      {
        cropId: wheatCrop.id,
        quantity: 100,
        orderDate: "2026-11-10",
        status: "Pending",
      },
      {
        cropId: riceCrop.id,
        quantity: 75,
        orderDate: "2026-11-10",
        status: "Delivered",
      },
    ];

    for (const orderData of orders) {
      const [order, created] = await Order.findOrCreate({
        where: {
          cropId: orderData.cropId,
          orderDate: orderData.orderDate,
          quantity: orderData.quantity,
        },
        defaults: orderData,
      });

      console.log(
        created
          ? `Order created: ${order.id}`
          : `Order already exists: ${order.id}`
      );
    }

    // Step 7: Sample tasks
    const sugarcaneCrop = await Crop.findOne({
      where: { name: "Sugarcane", field: "Field C" },
    });

    const tasks = [
      {
        title: "Irrigate Wheat Field",
        type: "Irrigation",
        cropId: wheatCrop.id,
        dueDate: "2026-11-15",
        status: "Pending",
      },
      {
        title: "Fertilize Rice Field",
        type: "Fertilizer",
        cropId: riceCrop.id,
        dueDate: "2026-11-12",
        status: "Pending",
      },
      {
        title: "Inspect Sugarcane Growth",
        type: "Labour",
        cropId: sugarcaneCrop.id,
        dueDate: "2026-11-20",
        status: "Pending",
      },
    ];

    for (const taskData of tasks) {
      const [task, created] = await Task.findOrCreate({
        where: {
          title: taskData.title,
          dueDate: taskData.dueDate,
        },
        defaults: taskData,
      });

      console.log(
        created
          ? `Task created: ${task.title}`
          : `Task already exists: ${task.title}`
      );
    }

    // Step 8: Sample expenses
    const expenses = [
      {
        cropId: wheatCrop.id,
        category: "Fertilizer",
        amount: 5000,
        date: "2026-11-05",
        note: "Urea applied to wheat field",
      },
      {
        cropId: riceCrop.id,
        category: "Fuel",
        amount: 2000,
        date: "2026-11-06",
        note: "Tractor fuel for rice field",
      },
      {
        cropId: null,
        category: "Repair",
        amount: 8000,
        date: "2026-11-07",
        note: "Water pump repair",
      },
    ];

    for (const expenseData of expenses) {
      const [expense, created] = await Expense.findOrCreate({
        where: {
          category: expenseData.category,
          date: expenseData.date,
          amount: expenseData.amount,
        },
        defaults: expenseData,
      });

      console.log(
        created
          ? `Expense created: ${expense.category} - ${expense.amount}`
          : `Expense already exists: ${expense.category} - ${expense.amount}`
      );
    }

    console.log("Orders, tasks and expenses seeding completed.");

    // Step 9: Sample attendance
    const workersList = await Worker.findAll({
      where: {
        cnic: [
          "35202-1111111-1",
          "35202-2222222-2",
        ],
      },
    });

    const attendanceRecords = [
      {
        workerId: workersList.find(
          (worker) => worker.cnic === "35202-1111111-1"
        )?.id,
        date: "2026-11-10",
        status: "Present",
        note: "Full working day",
      },
      {
        workerId: workersList.find(
          (worker) => worker.cnic === "35202-2222222-2"
        )?.id,
        date: "2026-11-10",
        status: "Half-day",
        note: "Worked half day",
      },
    ];

    for (const attendanceData of attendanceRecords) {
      if (!attendanceData.workerId) {
        throw new Error("Required worker not found for attendance.");
      }

      const [attendance, created] = await Attendance.findOrCreate({
        where: {
          workerId: attendanceData.workerId,
          date: attendanceData.date,
        },
        defaults: attendanceData,
      });

      console.log(
        created
          ? `Attendance created: ${attendance.id}`
          : `Attendance already exists: ${attendance.id}`
      );
    }

    console.log("Attendance seeding completed.");

    // Step 10: Sample equipment
    const equipmentItems = [
      {
        name: "John Deere Tractor",
        type: "Tractor",
        purchaseDate: "2025-01-10",
        status: "Active",
        lastServiceDate: "2026-10-01",
        serviceIntervalDays: 90,
        notes: "Main agricultural tractor",
      },
      {
        name: "Water Pump",
        type: "Irrigation Equipment",
        purchaseDate: "2025-03-15",
        status: "Active",
        lastServiceDate: "2026-09-15",
        serviceIntervalDays: 60,
        notes: "Used for field irrigation",
      },
      {
        name: "Harvester Machine",
        type: "Harvesting Equipment",
        purchaseDate: "2024-12-20",
        status: "Under Repair",
        lastServiceDate: "2026-08-01",
        serviceIntervalDays: 120,
        notes: "Requires mechanical inspection",
      },
    ];

    for (const equipmentData of equipmentItems) {
      const [equipment, created] = await Equipment.findOrCreate({
        where: {
          name: equipmentData.name,
        },
        defaults: equipmentData,
      });

      console.log(
        created
          ? `Equipment created: ${equipment.name}`
          : `Equipment already exists: ${equipment.name}`
      );
    }

    console.log("Equipment seeding completed.");

    // Step 11: Sample maintenance records
    const tractor = await Equipment.findOne({
      where: { name: "John Deere Tractor" },
    });

    const waterPump = await Equipment.findOne({
      where: { name: "Water Pump" },
    });

    const maintenanceRecords = [
      {
        equipmentId: tractor.id,
        date: "2026-10-01",
        description: "Engine oil and filter replacement",
        cost: 12000,
        performedBy: "Ali Mechanic",
      },
      {
        equipmentId: waterPump.id,
        date: "2026-09-15",
        description: "Water pump servicing",
        cost: 5000,
        performedBy: "Usman Mechanic",
      },
    ];

    for (const maintenanceData of maintenanceRecords) {
      if (!maintenanceData.equipmentId) {
        throw new Error("Equipment not found for maintenance record.");
      }

      const [maintenance, created] = await Maintenance.findOrCreate({
        where: {
          equipmentId: maintenanceData.equipmentId,
          date: maintenanceData.date,
          description: maintenanceData.description,
        },
        defaults: maintenanceData,
      });

      console.log(
        created
          ? `Maintenance created: ${maintenance.id}`
          : `Maintenance already exists: ${maintenance.id}`
      );
    }

    console.log("Attendance, equipment and maintenance seeding completed.");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

seedData();

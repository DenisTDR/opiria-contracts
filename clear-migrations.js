const MigrationsPath = "./build/contracts/Migrations.json";
try {
    const Migrations = require(MigrationsPath);

    Migrations.networks = {};

    const fs = require("fs");

    fs.writeFile(MigrationsPath, JSON.stringify(Migrations, null, "\t"), 'utf8', function (st1, st2) {
        console.log("done");
    });
}catch (e) {
    console.log("cant clear migrations");
}
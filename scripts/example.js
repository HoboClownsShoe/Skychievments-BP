import {world} from "@minecraft/server";
import {JsonDatabase} from "./con-database.js";

const db = new WorldDatabase("my id");

db.set("key1", "value1");
db.set("key2", {isComplexObject: true});

console.warn(db.get("key1")); // "value1"

db.delete("key1");

console.warn(db.get("key1")); // undefined

// Iterating over the map using for loop
for (const [key, value] of db) {
  console.warn(`${key} = ${value}`);
}

db.clear();

// Getting the size of the map
console.warn(db.size); // 0
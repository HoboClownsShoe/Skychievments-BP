import { JaylyDB } from "../index";
import { AssertionError, assert } from "assert/index";
import { JsonDatabase } from "./database/con-database.js";

export function Main () {
  const datab = new JsonDatabase("QuestingAintEasy");
  const expected = "test41";
  datab.set("test1", expected);
  assert(datab.get("test1") === expected, new AssertionError({ actual: datab.get("test1"), operator: "!=", expected }));
  datab.clear();
}
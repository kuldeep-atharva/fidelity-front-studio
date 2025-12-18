// Test the case number extraction logic
// Run this in your browser console to debug

// Old regex (BROKEN)
const oldRegex = /(CASE-\d+|INC-\d+)/i;
console.log("OLD REGEX RESULTS:");
console.log("CASE-2025-001:", "CASE-2025-001".match(oldRegex)?.[1]); // Returns "CASE-2025" ❌
console.log("INC-12345-67:", "INC-12345-67".match(oldRegex)?.[1]);   // Returns "INC-12345" ❌

// New regex (FIXED)
const newRegex = /(CASE-\d+(?:-\d+)*|INC-\d+(?:-\d+)*)/i;
console.log("\nNEW REGEX RESULTS:");
console.log("CASE-2025-001:", "CASE-2025-001".match(newRegex)?.[1]); // Returns "CASE-2025-001" ✅
console.log("INC-12345-67:", "INC-12345-67".match(newRegex)?.[1]);   // Returns "INC-12345-67" ✅
console.log("CASE-123:", "CASE-123".match(newRegex)?.[1]);           // Returns "CASE-123" ✅

// Test with full sentences
const testMessages = [
  "what's the status of case CASE-2025-001",
  "show me details for INC-12345-67", 
  "CASE-123 needs attention"
];

console.log("\nFULL MESSAGE TESTS:");
testMessages.forEach(msg => {
  const match = msg.match(newRegex)?.[1];
  console.log(`"${msg}" → "${match}"`);
});


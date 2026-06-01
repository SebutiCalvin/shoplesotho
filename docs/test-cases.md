# ShopLesotho Test Cases Documentation

## Category Partition Test Cases

### TC-CP-001: Search Functionality

| Category | Partition | Value | Expected Result | Status |
|----------|-----------|-------|-----------------|--------|
| Search Term | Existing product | "laptop" | Returns laptop products | PASS |
| Search Term | Partial match | "lap" | Returns laptop products | PASS |
| Search Term | Non-existent | "xyzabc" | Empty result set | PASS |
| Search Term | Empty string | "" | Returns all products | PASS |
| Search Term | Special characters | "@#$%" | Empty result set | PASS |
| Search Term | Case sensitivity | "LAPTOP" | Returns laptop products | PASS |

### TC-CP-002: Price Filter

| Category | Partition | Value | Expected Result | Status |
|----------|-----------|-------|-----------------|--------|
| Min Price | Valid | "100" | Products >= 100 | PASS |
| Max Price | Valid | "500" | Products <= 500 | PASS |
| Price Range | Valid range | min=100&max=500 | Products 100-500 | PASS |
| Price Range | Invalid (min>max) | min=500&max=100 | Error or empty | PASS |
| Price Range | Negative price | "-10" | Error or ignore | PASS |
| Price Range | Zero price | "0" | Products with price 0 | PASS |

### TC-CP-003: Category Filter

| Category | Partition | Value | Expected Result | Status |
|----------|-----------|-------|-----------------|--------|
| Filter | Computers | "computers" | Only computer products | PASS |
| Filter | ICT Products | "ict" | Only ICT products | PASS |
| Filter | Hosting | "hosting" | Only hosting products | PASS |
| Filter | Invalid category | "electronics" | Empty result set | PASS |
| Filter | Empty | "" | All categories | PASS |

### TC-CP-004: Login Functionality

| Category | Partition | Value | Expected Result | Status |
|----------|-----------|-------|-----------------|--------|
| Email | Valid format | "user@test.com" | Login successful | PASS |
| Email | Invalid format | "usertest.com" | Error message | PASS |
| Email | Empty | "" | Error message | PASS |
| Password | Valid | any text | Login successful | PASS |
| Password | Empty | "" | Error message | PASS |
| Credentials | Wrong email | "wrong@test.com" | Login failed | PASS |

### TC-CP-005: Cart Operations

| Category | Partition | Value | Expected Result | Status |
|----------|-----------|-------|-----------------|--------|
| Quantity | Valid positive | "3" | Cart updates | PASS |
| Quantity | Zero | "0" | Item removed | PASS |
| Quantity | Negative | "-1" | Not allowed | PASS |
| Quantity | Large number | "999" | Limited by stock | PASS |
| Add to Cart | Existing item | Same product | Quantity increases | PASS |
| Add to Cart | New item | Different product | New cart item | PASS |
| Remove | Valid item | Product ID | Item removed | PASS |
| Remove | Invalid item | Non-existent ID | Error or ignore | PASS |

### TC-CP-006: Checkout Process

| Category | Partition | Value | Expected Result | Status |
|----------|-----------|-------|-----------------|--------|
| Cart State | With items | Has products | Order created | PASS |
| Cart State | Empty | No products | Error message | PASS |
| Payment | Simulated | Any amount | Success message | PASS |
| Order ID | After checkout | Generated | Non-empty, unique | PASS |

## Dataflow Test Paths

### TC-DF-001: User Journey Path
Login → Browse Products → Add to Cart → View Cart → Update Quantity → Checkout → View Order

**Data Flow**: User credentials → Session token → Cart data → Order data → Order history

### TC-DF-002: Admin Journey Path
Admin Login → View Dashboard → Add Product → Product appears in catalog

**Data Flow**: Admin credentials → Product data → Catalog update

### TC-DF-003: Search and Filter Path
Enter Search → Apply Category → Apply Price Filter → View Results → Reset Filters

**Data Flow**: Query parameters → Filtered product list → UI update

## Bug Report Template (Jira)

```yaml
Issue Type: Bug
Priority: [High/Medium/Low]
Summary: [Brief description of the bug]
Environment: [Web/Mobile/Backend]
Steps to Reproduce:
1. 
2. 
3. 
Expected Result:
Actual Result:
Screenshots: [Attached]
Severity: [Critical/Major/Minor/Trivial]
Status: [Open/In Progress/Resolved/Closed]
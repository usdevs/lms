## Plan & Workflow Guide

This guide explains the **domain schema** (how the core tables relate) and the **intended workflow** for loans.

NOTE: The schema is super rough (its pretty much what they gave us + a few minor changes by me), so feel free to edit it a necessayr

### 1. Domain schema

- **IH (Item Holder)**
  - Represents the **owner / custodian** of items.
  - Key fields:
    - `ihId`: Stable identifier for the IH.
    - `ihName`: Human‑readable name.
    - `ihPocTele`: Telegram / contact handle of the IH POC (optional).
  - Relationships:
    - `items`: All `Item` rows currently under this IH.
    - `loanDetails`: All `LoanItemDetail` rows where this IH was responsible at the point of loan.

- **Item**
  - Represents a **physical inventory item** that can be loaned.
  - Key fields:
    - `itemId`: Autoincrementing serial number.
    - `itemDesc`: Description/Name of the item.
    - `itemSloc`: Storage location ID (FK to `Sloc`).
    - `itemIh`: Current IH ID (FK to `IH`).
    - `itemQty`: **Current available quantity** in stock.
    - `itemUom`: Unit of measure (e.g. `pcs`, `sets`).
    - `itemPurchaseDate`, `itemRfpNumber`, `itemImage`, `itemRemarks`: Optional metadata.
  - Relationships:
    - `sloc`: The `Sloc` row describing where it is stored.
    - `ih`: The `IH` row describing who is responsible.
    - `loanDetails`: All `LoanItemDetail` rows for loans involving this item.

- **Sloc (Storage Location)**
  - Represents a **physical storage location** (e.g. store room).
  - Key fields:
    - `slocId`: ID of the location.
    - `slocName`: Human‑readable name.
  - Relationships:
    - `items`: All items currently stored here.
    - `loanDetails`: Historical loan details that used this sloc during the event.

- **Requester**
  - Represents the **end user** requesting loans (usually a member / event IC).
  - Key fields:
    - `reqId`: Internal ID.
    - `reqName`: Name of requester.
    - `reqTelehandle`: Telegram handle for notifications (optional but important in workflow).
    - `reqNusnet`: Unique NUSNET ID.
  - Relationships:
    - `loanRequests`: All `LoanRequest` rows created by this requester.

- **Loggies**
  - Represents **logistics staff** who manage and approve/track loans.
  - Key fields:
    - `loggieId`: Internal ID.
    - `loggieName`: Name of loggie.
    - `loggieTele`: Telegram / contact (optional).
    - `loggieNusnet`: Unique NUSNET ID.
  - Relationships:
    - `loanRequests`: All `LoanRequest` rows handled by this loggie.

- **LoanRequest**
  - Represents a **loan request “header”** for an event or period.
  - Key fields:
    - `refNo`: Primary key (loan reference number, shared by all items in this request).
    - `loanDateStart`, `loanDateEnd`: Planned loan period.
    - `reqId`: FK to `Requester` (who is borrowing).
    - `loggieId`: FK to `Loggies` (assigned handler, optional in early phases).
    - `organisation`, `eventDetails`, `eventLocation`: Optional contextual info.
    - `requestStatus`: Overall status of the request (e.g. requested, pending, approved, rejected, closed).
  - Relationships:
    - `requester`: The user who created the request.
    - `loggie`: The loggie responsible for handling/approving the request.
    - `loanDetails`: One‑to‑many `LoanItemDetail` rows for each item and quantity in this request.

- **LoanItemDetail**
  - Represents a **single line item within a loan request**.
  - Key fields:
    - `loanDetailId`: Primary key.
    - `refNo`: FK to `LoanRequest` (header).
    - `itemId`: FK to `Item.id` (which item is being loaned).
    - `loanQty`: Quantity of this item requested/loaned.
    - `loanStatus`: Status of this line item (e.g. pending, dispensed, returned).
    - `itemSlocAtLoan`: (??) Not really sure what this is. To clairfy with logs team.
    - `itemIhAtLoan`: (??) Not really sure what this is. To clairfy with logs team.
  - Relationships:
    - `loanRequest`: Back‑reference to the header (`LoanRequest`).
    - `item`: The `Item` to which this loan line refers.
    - `slocAtLoan`: The `Sloc` at the time of loan, if recorded.
    - `ihAtLoan`: The `IH` at the time of loan, if recorded.

In summary:
- **Requester** asks to borrow items.
- **Loggies** manage and coordinate the loan.
- **IHs** own/hold the items and often handle hand‑over.
- **LoanRequest** + **LoanItemDetail** model the full lifecycle of each loaned item.

### 2. Workflow overview

The workflow is designed to roll out in **two phases**:
- **Phase 1**: Simplified process with **no in‑app approval flow**. Approvals happen via Telegram, and loggie staff manually create and close loans in the system.
- **Phase 2**: Fully integrated flow where users can create loan requests from the dashboard, and all three parties can track status in the app with Telegram notifications.

#### Phase 1 workflow (initial rollout)

In Phase 1, the underlying schema is the same as Phase 2, but the **approval step lives outside the app**:

- **Loan initiation**
  - User contacts **loggies via Telegram** (or existing channels) to request items.
  - Loggie discusses with IHs and decides whether to approve, entirely outside of the system.

- **Loan creation**
  - Once approved (informally, via Telegram), a **loggie staff** member creates the corresponding `LoanRequest` and `LoanItemDetail` rows in the app.
  - System should automatically deduct the item's available quantity

- **Loan lifecycle tracking**
  - When the loan is over (items fully returned and accounted for), the **loggie** updates the relevant `LoanItemDetail.loanStatus` values (e.g. to `returned`).
  - This should automatically restore the item's available quantity.
    - Marks the `LoanRequest.requestStatus` as closed/complete.

- **Key difference from Phase 2**
  - There is **no in‑app approval UI** and **no automatic user‑initiated loan dashboard flow** yet.
  - All approvals and coordination are offloaded to Telegram; the system is mainly a **record of truth** maintained by loggies.

#### Phase 2 workflow (fully integrated)

In Phase 2, the same schema is used, but the workflow is user‑driven and visible to all three parties (Requester, IH, Loggies).

1. **User creates a loan from the dashboard**
   - From the **loan dashboard**, the user (Requester) selects items and quantities and submits a **loan request**.
   - The system creates a `LoanRequest` (header) and one or more `LoanItemDetail` records (line items).
   - This request is visible to:
     - **Loggies** (to review and coordinate),
     - The relevant **IHs** (based on the items’ `itemIh`),
     - The **Requester** (who created it).

2. **Three‑party visibility of loan status**
   - At all times, **Requester, IH, and Loggies** can see:
     - Overall request status (`LoanRequest.requestStatus`),
     - Per‑item status (`LoanItemDetail.loanStatus`),
     - Key dates and quantities.

3. **On successful approval: notify and reserve stock**
   - When loggies/IHs approve the loan:
     - The system sends a **Telegram message** to the user using `Requester.reqTelehandle`, including:
       - The **Telegram handle of the IH POC** (`IH.ihPocTele`),
       - Summary of the approved loan.
     - The **status of each approved loan line** is set to **`pending`** (waiting for physical collection).

4. **Dispensing: items handed over**
   - Once the user collects the items:
     - **Loggie or IH** marks the relevant `LoanItemDetail` rows as **`dispensed`**.

5. **Return: items brought back**
   - When the loaned items are returned:
     - **Loggie** updates the corresponding `LoanItemDetail` rows to **`returned`**.
     - When all line items for a `LoanRequest` are returned (or otherwise closed), the overall `LoanRequest.requestStatus` is marked as closed/complete.

### 3. Other Features

1. All authentication (for phase 2) will be done via telegram

2. Also need some way to support auditing (to clarify with logs team)

3. Also needs to support barcode scanning during loan creation / returning (to clarify with logs team)

4. Eventuallly for deployment, the db wil be hosted on Supabase.



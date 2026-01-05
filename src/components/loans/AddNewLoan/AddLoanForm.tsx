"use client";

export default function AddLoanForm() {
  return (
    <form className="space-y-4 max-w-lg border p-6 rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Add New Loan</h2>
      
      <div>
        <label className="block text-sm font-medium">Requester Name</label>
        <input type="text" name="requester" className="w-full border p-2 rounded mt-1" />
      </div>

      <div>
        <label className="block text-sm font-medium">Date</label>
        <input type="date" name="date" className="w-full border p-2 rounded mt-1" />
      </div>

      <button type="submit" className="bg-black text-white px-4 py-2 rounded-md w-full">
        Submit Loan Request
      </button>
    </form>
  );
}
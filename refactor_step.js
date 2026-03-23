const fs = require('fs');
const path = require('path');

const filePath = String.raw`d:\ky7\SWP\Group1_Topic7_FE\src\pages\central-kitchen\CreateProductionPlan.tsx`;
let content = fs.readFileSync(filePath, 'utf-8');

// 1. State
content = content.replace('useState<1 | 2 | 3>(1)', 'useState<1 | 2>(1)');

// 2. useEffect
const oldUseEffect = `  useEffect(() => {
    if (step === 2 && selectedKitchenId) {
      fetchOrders();
    }
  }, [step, selectedKitchenId, fetchOrders]);`;
const newUseEffect = `  useEffect(() => {
    if (step === 1 && selectedKitchenId) {
      fetchOrders();
    }
  }, [step, selectedKitchenId, fetchOrders]);`;
content = content.replace(oldUseEffect, newUseEffect);

// 3. Wizard header
const oldWizard = `      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { step: 1, label: "Thiết lập bếp & Ngày", icon: ChefHat },
          { step: 2, label: "Gom đơn hàng chi nhánh", icon: LayoutGrid },
          { step: 3, label: "Tổng hợp chỉ tiêu SX", icon: ClipboardCheck },
        ]`;
const newWizard = `      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
        {[
          { step: 1, label: "Cấu hình & Chọn đơn", icon: LayoutGrid },
          { step: 2, label: "Tổng hợp chỉ tiêu SX", icon: ClipboardCheck },
        ]`;
content = content.replace(oldWizard, newWizard);

// 4. Step 1 Layout wrapper
const oldLayout = `        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-6 bg-zinc-900/40 p-8 rounded-[32px] border border-zinc-800/50">`;
const newLayout = `        {step === 1 && (
          <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex-1 space-y-8">
              <div className="space-y-6 bg-zinc-900/40 p-8 rounded-[32px] border border-zinc-800/50">`;
content = content.replace(oldLayout, newLayout);

// 5. Connecting Step 1 config to Step 2 table
const oldMiddle = `              </div>
            </div>

            <div className="flex flex-col justify-end bg-zinc-900/40 p-8 rounded-[32px] border border-zinc-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[80px] -mr-24 -mt-24"></div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white leading-tight">
                    Sẵn sàng để gom đơn hàng?
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium tracking-tight">
                    Bước tiếp theo bạn sẽ chọn các đơn hàng chi nhánh đã duyệt
                    để tổng hợp chỉ tiêu.
                  </p>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedKitchenId || !plannedDate}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-900/20 border-0"
                >
                  Tiếp tục Bước 2 <ChevronRight size={18} className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col lg:flex-row gap-8 animate-in slide-in-from-right-8 duration-500">
            {/* Main Table Area */}
            <div className="flex-1 space-y-4">
              <div className="bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 overflow-hidden shadow-2xl">`;
const newMiddle = `              </div>
              {/* Main Table Area */}
              <div className="bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 overflow-hidden shadow-2xl">`;
if (content.includes(oldMiddle)) {
  content = content.replace(oldMiddle, newMiddle);
} else {
  console.log("oldMiddle not found");
}

// 6. Removing Back Button in the middle
const oldBackButton = `              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-zinc-500 hover:text-white font-bold uppercase text-[10px] tracking-widest px-6 h-12"
              >
                <ArrowLeft size={16} className="mr-2" /> Quay lại Bước 1
              </Button>
            </div>`;
const newBackButton = `            </div>`;
if (content.includes(oldBackButton)) {
  content = content.replace(oldBackButton, newBackButton);
} else {
  console.log("oldBackButton not found");
}

// 7. Sidebar Next button & text
content = content.replace('onClick={() => setStep(3)}', 'onClick={() => setStep(2)}');
content = content.replace('Tiếp tục Bước 3', 'Tiếp tục Bước 2');

// 8. Step 3 -> Step 2
content = content.replace('{step === 3 && (', '{step === 2 && (');

// 9. Final Step Back button (from 2 to 1)
content = content.replace('onClick={() => setStep(2)}', 'onClick={() => setStep(1)}');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Refactoring complete!');

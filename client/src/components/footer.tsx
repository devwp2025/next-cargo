import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-sm mb-4">หมวดหมู่</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/category/shoes">รองเท้า</Link></li>
              <li><Link href="/category/bags">กระเป๋า</Link></li>
              <li><Link href="/category/clothes">เสื้อผ้า</Link></li>
              <li><Link href="/category/jewelry">เครื่องประดับ</Link></li>
              <li><Link href="/category/collectibles">ของสะสม</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-4">ขายสินค้า</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/dashboard/products/new">ลงขายสินค้า</Link></li>
              <li><Link href="/dashboard">แดชบอร์ดผู้ขาย</Link></li>
              <li><Link href="/dashboard/orders">รายการขาย</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-4">ช่วยเหลือ</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>คำถามที่พบบ่อย</li>
              <li>นโยบายการจัดส่ง</li>
              <li>นโยบายการคืนสินค้า</li>
              <li>การตรวจสอบของแท้</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-4">เกี่ยวกับ NEXT CARGO</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              ตลาดสินค้าแบรนด์เนมมือสองที่คุณไว้วางใจ สินค้าทุกชิ้นตรวจสอบแล้ว ทุกธุรกรรมปลอดภัย
            </p>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-xs opacity-60">
          <p>2024 NEXT CARGO สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </footer>
  );
}

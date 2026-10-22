import pathlib,sqlite3,unittest,json,struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
class StorageTests(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:')
  for p in sorted((ROOT/'drizzle').glob('*.sql')):self.db.executescript(p.read_text())
  self.db.execute('PRAGMA foreign_keys=ON')
  self.db.execute("INSERT INTO profiles VALUES('u','example@invalid.test','Example',0)")
  self.db.execute("INSERT INTO vehicles VALUES('v','u','SUV','Plata','DEMO')")
 def order(self,id='a',status='requested',bay=None,key=None,total=4500):
  self.db.execute('INSERT INTO orders(id,owner_id,vehicle_id,status,total,payment_status,bay,version,request_key,request_hash,created_at,updated_at) VALUES(?,?,?, ?,?, ?,?, ?,?, ?,?,?)',(id,'u','v',status,total,'pending',bay,1,key or id,'hash',0,0))
 def test_single_bay_occupancy(self):
  self.order('a','working',2)
  with self.assertRaises(sqlite3.IntegrityError):self.order('b','working',2)
 def test_bay_released_on_completion(self):
  self.order('a','working',2);self.db.execute("UPDATE orders SET status='ready',bay=NULL WHERE id='a'");self.order('b','working',2)
 def test_work_requires_valid_bay(self):
  for bay in [None,0,6]:
   with self.assertRaises(sqlite3.IntegrityError):self.order('a'+str(bay),'working',bay)
 def test_idempotency_unique_per_owner(self):
  self.order('a',key='same')
  with self.assertRaises(sqlite3.IntegrityError):self.order('b',key='same')
 def test_order_status_enforced(self):
  with self.assertRaises(sqlite3.IntegrityError):self.order(status='arbitrary')
 def test_money_nonnegative(self):
  with self.assertRaises(sqlite3.IntegrityError):self.order(total=-1)
 def test_payment_cannot_duplicate(self):
  self.order();self.db.execute("INSERT INTO payments VALUES('p','a',4500,'cash','u',0)")
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO payments VALUES('p2','a',4500,'cash','u',0)")
 def test_event_references_real_order(self):
  with self.assertRaises(sqlite3.IntegrityError):self.db.execute("INSERT INTO order_events VALUES('e','missing','u','Example',0)")
 def test_glb_external_images_available(self):
  for p in (ROOT/'public/models').glob('*/*.glb'):
   b=p.read_bytes();n=struct.unpack('<I',b[12:16])[0];data=json.loads(b[20:20+n]);self.assertEqual(b[:4],b'glTF')
   for img in data.get('images',[]):
    if img.get('uri') and not img['uri'].startswith('data:'):self.assertTrue((p.parent/img['uri']).exists(),str(p))
if __name__=='__main__':unittest.main(verbosity=2)

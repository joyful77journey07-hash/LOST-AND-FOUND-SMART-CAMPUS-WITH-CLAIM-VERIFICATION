const db = require('./db');
const bcrypt = require('bcryptjs');

db.exec("DELETE FROM UserReports; DELETE FROM Claims; DELETE FROM Items; DELETE FROM Users WHERE role!='admin';");

// Always reset the admin password to admin123 (in case it was changed via Profile)
db.prepare("UPDATE Users SET password_hash=? WHERE role='admin'").run(bcrypt.hashSync('admin123', 10));

const insUser = db.prepare('INSERT INTO Users (name,email,roll_no,password_hash,role,contact) VALUES (?,?,?,?,?,?)');
const pass = bcrypt.hashSync('pass123', 10);

// 25 found users
const foundUsers = [];
for (let i = 1; i <= 25; i++) {
  const name = 'Finder ' + String(i).padStart(2, '0');
  const email = 'finder' + String(i).padStart(2, '0') + '@campus.edu';
  const roll = '210' + String(i).padStart(4, '0');
  const contact = '9876543' + String(210 + i).padStart(3, '0');
  const id = insUser.run(name, email, roll, pass, 'student', contact).lastInsertRowid;
  foundUsers.push({ id, name, email, contact });
}

// 5 general users
const generalUsers = [];
for (let i = 1; i <= 5; i++) {
  const name = 'User ' + String(i).padStart(2, '0');
  const email = 'user' + String(i).padStart(2, '0') + '@campus.edu';
  const roll = '210' + String(25 + i).padStart(4, '0');
  const contact = '9876543' + String(235 + i).padStart(3, '0');
  const id = insUser.run(name, email, roll, pass, 'student', contact).lastInsertRowid;
  generalUsers.push({ id, name, email, contact });
}

// categories
const cat = (name) => db.prepare('SELECT category_id FROM Categories WHERE category_name=?').get(name).category_id;
const cats = ['Electronics','ID Cards','Books & Notes','Accessories','Clothing','Wallets & Keys','Water Bottles','Umbrellas','Others'].map(cat);

const insItem = db.prepare(`INSERT INTO Items (type,name,category_id,description,location,item_date,image_path,contact_info,hidden_verification,status,reported_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

// Each found item has a correct category, realistic description and campus location
const FOUND = [
  ['Blue Leather Wallet',      'Wallets & Keys', 'Blue bifold wallet with a few cards inside',              'Central Library, 2nd floor reading hall'],
  ['Student ID Card',          'ID Cards',       'College ID card found near the gate',                      'Main Gate security cabin'],
  ['White Wired Earphones',    'Electronics',    'White earphones with mic, slightly tangled',               'Lecture Hall LH-3'],
  ['Steel Water Bottle',       'Water Bottles',  '1 litre steel bottle, dark green, with a dent',            'Sports Ground bleachers'],
  ['Black Folding Umbrella',   'Umbrellas',      'Compact black 3-fold umbrella',                            'Bus Stop near Block B'],
  ['Scientific Calculator',    'Electronics',    'Casio fx-991 scientific calculator',                       'Exam Hall 2'],
  ['Phone Charger',            'Electronics',    'Type-C fast charger with cable',                           'Computer Lab 1'],
  ['Spiral Notebook',          'Books & Notes',  'A4 spiral notebook with maths notes',                      'Canteen table near window'],
  ['Bunch of Keys',            'Wallets & Keys', 'Three keys on a ring with a small keychain',               'Parking area, two-wheeler section'],
  ['Pink Umbrella',            'Umbrellas',      'Long pink umbrella with wooden handle',                    'Admin Block corridor'],
  ['Grey Backpack',            'Accessories',    'Grey backpack with laptop sleeve, empty',                  'Auditorium back row'],
  ['Analog Wrist Watch',       'Accessories',    'Silver analog watch with brown strap',                     'Gym changing room'],
  ['Spectacles in Case',       'Accessories',    'Black frame spectacles in a blue case',                    'Seminar Hall'],
  ['Bluetooth Headphones',     'Electronics',    'Over-ear black Bluetooth headphones',                      'Library discussion room'],
  ['Pen Drive 32GB',           'Electronics',    'SanDisk 32GB pen drive, red',                              'Computer Lab 2, desk 14'],
  ['Wireless Mouse',           'Electronics',    'Black wireless mouse without receiver',                    'Computer Lab 1'],
  ['Mechanical Keyboard',      'Electronics',    'Compact mechanical keyboard with USB cable',               'Project Lab'],
  ['Engineering Maths Textbook','Books & Notes', 'B.S. Grewal textbook, name written inside',                'Classroom 204'],
  ['Denim Jacket',             'Clothing',       'Blue denim jacket, size M',                                'Basketball Court bench'],
  ['Sports Shoes',             'Clothing',       'White Nike running shoes, size 9',                         'Sports Complex locker area'],
  ['Baseball Cap',             'Clothing',       'Navy cap with a small logo',                               'Cricket Ground'],
  ['Woollen Scarf',            'Clothing',       'Maroon woollen scarf',                                     'Hostel A common room'],
  ['Pair of Gloves',           'Clothing',       'Black leather riding gloves',                              'Parking area, bike stand'],
  ['Silver Ring',              'Accessories',    'Plain silver ring with an engraving',                      'Washroom near Canteen'],
  ['Beaded Bracelet',          'Accessories',    'Black and white beaded bracelet',                          'Yoga room'],
];
const HIDDEN = [
  'Has a small tear on the inner flap; contains a metro card',
  'Roll number ends with 42; photo has a blue background',
  'Right earbud has a tiny crack; small red sticker on the jack',
  'Dent near the base; sticker of a mountain on the side',
  'Handle has a yellow thread tied around it',
  'Name "RK" scratched on the back cover',
  'Cable has black tape near the plug',
  'First page has a doodle of a cat; name on the cover',
  'Keychain is a small red Eiffel tower',
  'Tip of one rib is bent; blue price tag still attached',
  'Inner pocket has a torn lining; a pen cap inside',
  'Scratch on the glass at 7 o\'clock position; strap hole stretched',
  'Left arm of the frame has a small white paint mark',
  'Left ear cushion is slightly torn; wallpaper sticker on the headband',
  'Cap is missing; the body has a crack at the back',
  'Battery cover has a sticker of a star',
  'Keycap "Esc" is a different colour (orange)',
  'Name "Priya S." written inside with a phone number',
  'Missing one button on the left cuff',
  'Right shoe lace is a different shade; initials inside',
  'Sweat mark inside; a small hole near the strap',
  'One end has a loose thread; a tiny burn mark',
  'Left glove has a stitched repair on the thumb',
  'Engraved with the letters "A&S"',
  'One bead is chipped; elastic is knotted twice',
];
const LOCS_LOST = ['Central Library', 'Canteen', 'Lecture Hall LH-1', 'Sports Complex', 'Bus Stop near Main Gate'];
const foundItems = [];
foundUsers.forEach((u, idx) => {
  const [name, category, desc, loc] = FOUND[idx];
  const day = String(1 + (idx % 17)).padStart(2, '0');
  const id = insItem.run('found', name, cat(category), desc, loc, '2026-10-' + day, null, u.contact, HIDDEN[idx], 'open', u.id).lastInsertRowid;
  foundItems.push({ id, reporter: u.id });
});

// 5 lost items by general users (correct categories)
const LOST = [
  ['Brown Wallet',          'Wallets & Keys', 'Brown leather wallet with driving licence and some cash'],
  ['College ID Card',       'ID Cards',       'ID card of a 2nd year BCA student, blue lanyard'],
  ['Black Earphones',       'Electronics',    'Black wired earphones in a small pouch'],
  ['Blue Water Bottle',     'Water Bottles',  'Blue 750 ml plastic sipper bottle'],
  ['Black Umbrella',        'Umbrellas',      'Large black umbrella with a curved handle'],
];
generalUsers.forEach((u, idx) => {
  const [name, category, desc] = LOST[idx];
  insItem.run('lost', name, cat(category), desc, LOCS_LOST[idx], '2026-10-1' + (idx+1), null, u.contact, null, 'open', u.id);
});

// claims: first 5 general users claim first 5 found items
const insClaim = db.prepare(`INSERT INTO Claims (item_id,claimant_id,lost_location,approx_datetime,claim_description,unique_features,extra_info,status,remarks) VALUES (?,?,?,?,?,?,?,?,?)`);
for (let i = 0; i < 5; i++) {
  const ci = foundItems[i];
  const claimant = generalUsers[i];
  const st = i === 0 ? 'Pending' : (i === 1 ? 'Under Review' : (i === 2 ? 'Approved' : 'Pending'));
  insClaim.run(ci.id, claimant.id, LOCS_LOST[i], '2026-10-10', 'I lost my ' + FOUND[i][0].toLowerCase() + ' last week, it looks exactly like this one', 'It has a small mark that only I would know about', 'Can describe the contents in person', st, '');
  if (st === 'Approved') {
    db.prepare("UPDATE Items SET status='claimed' WHERE item_id=?").run(ci.id);
  }
}

// ---- Flagged users: rejected / suspicious claims + reports from finders ----
// user04 makes two false claims (rejected) and gets reported twice; user05 makes one false claim,
// is reported, and has already been blocked by the admin.
const insReport = db.prepare(`INSERT INTO UserReports (reported_user_id,reporter_id,claim_id,item_id,description,status) VALUES (?,?,?,?,?,?)`);
const falseClaims = [
  // [claimant idx in generalUsers, found item idx, claim text, remarks, report text, report status]
  [3, 5,  'I lost my calculator in the exam hall, it is a Casio', 'Could not name the marking on the back cover', 'Answers do not match the hidden detail at all. Claimed it was brand new but the item has an engraving.', 'open'],
  [3, 13, 'These are my headphones, black ones, lost in the library', 'Said nothing was wrong with the cushions', 'Second item this user has claimed from me with vague answers. Looks like a serial false claimant.', 'open'],
  [4, 10, 'That is my grey backpack, I left it in the auditorium', 'Claimed it had a laptop inside; bag was empty and lining differs', 'Claimant described contents that were never in the bag and became abusive when questioned.', 'reviewed'],
];
falseClaims.forEach(([ui, fi, text, remarks, reportText, reportStatus]) => {
  const claimant = generalUsers[ui];
  const item = foundItems[fi];
  const r = insClaim.run(item.id, claimant.id, 'Not sure', '2026-10-05', text, 'It just looks like mine', '', 'Rejected', remarks);
  insReport.run(claimant.id, item.reporter, r.lastInsertRowid, item.id, reportText, reportStatus);
});
// admin blocked user05 after reviewing the report
db.prepare("UPDATE Users SET blocked=1, blocked_reason=? WHERE user_id=?").run('Repeated false claims and abusive behaviour towards a finder', generalUsers[4].id);

console.log('Seed complete.');
console.log('Admin: admin@campus.edu / admin123');
console.log('Found users: finder01@campus.edu .. finder25@campus.edu (pass123)');
console.log('General users: user01@campus.edu .. user05@campus.edu (pass123)');
console.log('Total users: 1 admin + 25 found + 5 general = 31');
console.log('Flagged users: user04 (2 reports, open), user05 (1 report, reviewed, BLOCKED)');
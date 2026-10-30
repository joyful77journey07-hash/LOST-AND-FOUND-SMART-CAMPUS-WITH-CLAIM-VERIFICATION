import { useLocation } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  const bottom = (
    <div className="footbottom">
      <span>© {year} Smart Campus Lost &amp; Found · All items are handled by the campus administration.</span>
      <span>Be honest. Be kind. Return what isn't yours. </span>
    </div>
  );

  // Other pages: compact footer only
  if (!isHome) return <footer className="footer sitefooter sitefooter-compact">{bottom}</footer>;

  return (
    <footer className="footer sitefooter">
      <div className="footgrid">
        <div className="footcol">
          <h4>LOST &amp; FOUND</h4>
          <p>Smart Campus Lost &amp; Found with Claim Verification. Helping students reunite with their belongings — safely, quickly.</p>
          <p className="footcreator">Created by Aditya Kumar</p>
        </div>

        <div className="footcol">
          <h4>How to use</h4>
          <ol>
            <li><b>Register / Login</b> with your campus email.</li>
            <li><b>Lost something?</b> Search the Found items or post a Lost report.</li>
            <li><b>Found something?</b> Post a Found report and keep a hidden detail secret (e.g. a scratch, sticker or serial no.).</li>
            <li><b>Claim</b> an item by answering the ownership questions.</li>
            <li>The finder/admin <b>verifies</b> your answers and marks the item as returned.</li>
          </ol>
        </div>

        <div className="footcol">
          <h4>Rules &amp; tips</h4>
          <ul>
            <li>Never reveal the hidden verification detail publicly.</li>
            <li>Give exact details in claims — vague or false claims are rejected.</li>
            <li>Repeated false claims can be reported and lead to account blocking.</li>
            <li>Valuables (ID cards, wallets, phones) should be deposited with the admin.</li>
          </ul>
        </div>

        <div className="footcol">
          <h4>Need help?</h4>
          <p>For any problem — a wrong claim, a blocked account, an item not listed, or technical issues — contact the admin:</p>
          <p className="footcontact">
            <a href="mailto:admin@campus.edu">admin@campus.edu</a><br/>
            <a href="tel:+919999999999">+91 99999 99999</a><br/>
            Admin Office, Student Help Desk, Ground Floor<br/>
            Mon–Sat, 9:00 AM – 5:00 PM
          </p>
        </div>
      </div>

      {bottom}
    </footer>
  );
}

/* Gearly Career: local, extractive search over the packet's static teaching content. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.GearlyCareerEngine = api;
}(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var SECTION_IDS = ['start','paths','opps','brand','resume','linkedin','elevator','coverletter','portfolio','dress','interviews','technical','careerfair','infosessions','networking','internship','offer','nointernship','gradschool','templates','checklist'];
  // Exclude both controls and their generated output, even if create() runs after restoration.
  var PRIVATE = 'script,style,nav,button,input,textarea,select,option,[contenteditable], [aria-live], .story-builder,.story-form,.story-list,.story-tabs,.pfields,.offer-list,.offer-ranking,.check-tools,#print-stories,#print-story-list,#prep-output,#bullet-out,#pitch-out,#story-list,#offer-list,#offer-ranking,#ai-out,#ai-ready,#cl-count,#gearly-career-panel';
  var STOP = new Set(('a an the is are was were be been being i me my mine we our you your it its this that those these of to in on for at by and or but with from as about how what when where why which who can could would should do does did have has had will shall please tell help want need get give make just like much many some any there then than also more only best good show find look know into').split(' '));
  var CORRECTIONS = {resum:'resume',resumes:'resume',resumé:'resume',resumee:'resume',resmue:'resume',resue:'resume',interveiw:'interview',interveiws:'interview',interviews:'interview',interviewer:'interview',scams:'scam',metrics:'metric',quantifying:'quantify',quantified:'quantify',accepting:'accept',declining:'decline',intervew:'interview',linkdin:'linkedin',linkedln:'linkedin',linked:'linkedin',protfolio:'portfolio',portfolios:'portfolio',portoflio:'portfolio',netwroking:'networking',netowrking:'networking',behavioural:'behavioral',behavorial:'behavioral',freshmen:'freshman',sophmore:'sophomore',coops:'coop',cooperatives:'coop',negotiating:'negotiation',negotiate:'negotiation',negotiated:'negotiation',internships:'internship',offers:'offer',templates:'template',bullets:'bullet',stories:'story',questions:'question',examples:'example',clothes:'attire',clothing:'attire',dressing:'dress',recruiters:'recruiter'};
  var TOPICS = [
    {id:'resume',name:'resumes',terms:/\b(resume|cv|bullet|ats|action verb|gpa|quantify|metric)\b/},
    {id:'brand',name:'personal branding',terms:/\b(personal brand|branding|professional identity)\b/},
    {id:'checklist',name:'preparation checklists',terms:/\b(checklist|check list)\b/},
    {id:'linkedin',name:'LinkedIn',terms:/\b(linkedin|headshot|headline|profile)\b/},
    {id:'elevator',name:'your introduction',terms:/\b(elevator|pitch|introduc|introduction|introduce myself|tell me about yourself)\b/},
    {id:'coverletter',name:'cover letters',terms:/\b(cover letter|coverletter)\b/},
    {id:'portfolio',name:'portfolios',terms:/\b(portfolio|github|project website|showcase)\b/},
    {id:'dress',name:'what to wear',terms:/\b(wear|dress|attire|outfit|suit|tie|shoes|business casual|business professional)\b/},
    {id:'interviews',name:'interview preparation',terms:/\b(interview|star|behavioral|story bank|conflict|failure|situation task|nervous|blank|freeze)\b/},
    {id:'technical',name:'technical preparation',terms:/\b(technical|mechanics|thermodynamics|fea|simulation|stress|strain|factor of safety|tolerance|materials|fluid)\b/},
    {id:'careerfair',name:'career fairs',terms:/\b(career fair|job fair|careerfair|booth|recruiter|printed resume)\b/},
    {id:'infosessions',name:'information sessions',terms:/\b(info session|information session|employer event|company presentation)\b/},
    {id:'networking',name:'networking',terms:/\b(networking|network|alumni|coffee chat|connection|referral|reach out)\b/},
    {id:'internship',name:'succeeding in an internship',terms:/\b(first day|first week|manager|mentor|return offer|impact log|during.*internship|start.*internship)\b/},
    {id:'offer',name:'evaluating offers',terms:/\b(offer|salary|compensation|negotia\w*|benefits|relocation|accept|decline|deadline extension)\b/},
    {id:'nointernship',name:'building experience',terms:/\b(no experience|no internship|do not have (an? )?internship|don t have (an? )?internship|without.*internship|without.*experience|didn.t get.*internship|personal project|design competition|certification|shadowing)\b/},
    {id:'gradschool',name:'research and graduate school',terms:/\b(grad school|graduate school|masters|master s|phd|research|faculty|professor|recommendation|statement of purpose|fellowship)\b/},
    {id:'templates',name:'message templates',terms:/\b(template|email|thank you|follow up|followup|status check|outreach|message|extension request)\b/},
    {id:'opps',name:'types of experience',terms:/\b(internship|coop|co op|externship|difference|compare.*experience)\b/},
    {id:'paths',name:'your career search',terms:/\b(search|application|apply|rejection|scam|fraud|international|visa|cpt|opt|sponsorship)\b/},
    {id:'start',name:'getting started',terms:/\b(start|begin|first step|prep plan|ecs|career services|handshake)\b/}
  ];
  function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function normalize(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).map(function(t){return CORRECTIONS[t] || t;}).join(' ');
  }
  function tokens(value) { return Array.from(new Set(normalize(value).split(' ').filter(function(t){return t.length > 1 && !STOP.has(t);}))); }
  function shortened(text, max) {
    if (text.length <= max) return text;
    var slice = text.slice(0,max), stop = Math.max(slice.lastIndexOf('. '),slice.lastIndexOf('? '),slice.lastIndexOf('! '));
    return stop > max * 0.5 ? slice.slice(0,stop+1) : slice.slice(0,slice.lastIndexOf(' '));
  }
  function staticSnapshot(doc) {
    var records = [], seen = new Set();
    SECTION_IDS.forEach(function(id) {
      var original = doc.getElementById(id);
      if (!original || original.tagName.toLowerCase() !== 'section') return;
      var section = original.cloneNode(true);
      section.querySelectorAll(PRIVATE).forEach(function(node){node.remove();});
      var title = clean(section.querySelector('h2') && section.querySelector('h2').textContent) || id;
      section.querySelectorAll('h2,h3,h4,p,li,pre,tr,summary,label.cli,.ct,.sh-desc,.bullet-blueprint ol').forEach(function(node) {
        var tag = node.tagName.toLowerCase();
        if (/^h[234]$/.test(tag)) return;
        if (node.matches('.ct')) return;
        if (tag === 'summary' || (tag === 'li' && (node.closest('.bullet-blueprint') || node.querySelector('p,h3,h4,li')))) return;
        if (node.parentElement.closest('pre,tr,label.cli')) return;
        var outerList = node.parentElement.closest('li');
        if (outerList && !outerList.querySelector('p,h3,h4')) return;
        var text = clean(node.textContent);
        if (text.length < 28 || seen.has(id+'|'+text)) return;
        // Get only a source anchor present in the original document. No generated IDs.
        var parent = node, anchor = id;
        while (parent && parent !== section) {
          if (parent.id && doc.getElementById(parent.id)) { anchor = parent.id; break; }
          parent = parent.parentElement;
        }
        var unit = node.closest('.tmpl,.card,.qcard,figure,details,.alt,.crow,.dress');
        var localHeading = null, headingParent = node.parentElement;
        // A card's label applies only inside that card, never to later sibling paragraphs.
        while (headingParent && headingParent !== section && !localHeading) {
          localHeading = headingParent.querySelector(':scope > h3,:scope > h4,:scope > .ct,:scope > summary');
          headingParent = headingParent.parentElement;
        }
        if (!localHeading && unit) localHeading = unit.querySelector('h3,.ct,h4,.dress-name,summary');
        if (localHeading && localHeading.matches('.dress-name')) localHeading = localHeading.firstChild;
        var row = {section:id,id:anchor,title:title,heading:localHeading ? clean(localHeading.textContent) : title,text:text,example:!!node.closest('.sample-resume,.star-answer,.bullet-stage-card,.annotated-bullet'),blueprint:!!node.closest('.bullet-blueprint'),letter:!!node.closest('.letter-blocks')};
        if (tag==='ol' && node.closest('.bullet-blueprint')) row.display = Array.from(node.querySelectorAll('li')).map(function(part){return clean(part.querySelector('strong').textContent)+' — '+clean(part.querySelector('span').textContent);}).join('; ');
        row.terms = tokens(title+' '+row.heading+' '+text);
        row.bodyTerms = tokens(text);
        row.headingTerms = tokens(title+' '+row.heading);
        row.normal = normalize(row.heading+' '+text);
        records.push(row); seen.add(id+'|'+text);
      });
    });
    return records;
  }
  function create(doc) {
    if (!doc || typeof doc.getElementById !== 'function') throw new TypeError('Gearly Career requires a document.');
    var records = staticSnapshot(doc), frequencies = Object.create(null);
    records.forEach(function(row){row.terms.forEach(function(t){frequencies[t]=(frequencies[t] || 0)+1;});});
    function response(kind,text,sources,suggestions,context) { return {kind:kind,text:text,sources:sources || [],suggestions:suggestions || [],context:context || {}}; }
    function answer(query, context) {
      context = context && typeof context === 'object' ? context : {};
      query = clean(query).slice(0,1600);
      var normalized = normalize(query), words = tokens(query);
      var defaults = ['How do I improve my resume?','How do I prepare for a career fair?','What is the STAR method?'];
      if (!normalized) return response('clarify','What would you like help finding in the career packet?',[],defaults,{});
      if (/^(hi|hello|hey|thanks|thank you|thankyou)$/.test(normalized)) return response('clarify',/thank/.test(normalized)?'You’re welcome! What else would you like to find in the packet?':'Hi! I’m Gearly. Ask me about this career packet, and I’ll point you to the matching guidance.',[],defaults,{});
      if (/\b(saved|my) (story|stories|offer|pitch|resume|prep plan|data)\b/.test(normalized) && /\b(read|see|access|score|review|retrieve|compare|remember|saved|analyze|analyse|show)\b/.test(normalized)) {
        return response('fallback','I search the packet’s teaching content, not your saved stories, offers, pitch, or form entries. Open the relevant tool to review your information.',[],['Where is the STAR story builder?','How does the packet evaluate offers?'],{});
      }
      if (/\b(weather|stock price|bitcoin|sports score|leaderboard|membership points|current events|next meeting|chapter president|live jobs|open vacancies|find.*jobs|job listings|scholarships|fair.*date|date.*fair)\b/.test(normalized)) return response('fallback','That information is outside this career packet. I can help find its career guidance and templates, but I don’t have live listings or chapter data.',[],defaults,{});
      var liveRequest = /\b(current|today|right now|latest|live)\b/.test(normalized) && /\b(salary|pay|hiring|vacancies|job|jobs|intern|interns|openings)\b/.test(normalized);
      var fairDate = /\b(when|date|schedule)\b/.test(normalized) && /\b(career fair|job fair)\b/.test(normalized) && !/\b(prepare|preparation|plan|before)\b/.test(normalized);
      if (liveRequest || fairDate) return response('fallback','I don’t have live hiring, salary, or event schedules. This packet covers how to prepare and evaluate opportunities; check the employer or Engineering Career Services for current details.',[],defaults,{});
      if (/\b(guarantee|guaranteed)\b/.test(normalized) && /\b(job|offer|internship)\b/.test(normalized)) return response('fallback','The packet cannot guarantee a job or offer. I can help you find practical preparation steps and ways to build evidence of your skills.',[],defaults,{});
      var hits = TOPICS.filter(function(t){return t.terms.test(normalized);});
      var explicitSections = hits.map(function(t){return t.id;});
      // A focused conversational follow-up may inherit only the previous verified section.
      var previous = SECTION_IDS.indexOf(context.section) !== -1 ? context.section : null;
      var followup = /\b(more|example|explain|details|that|this|it|shorter|checklist|template)\b/.test(normalized) || /^(and|what about|how about)\b/.test(normalized);
      var inherited = previous && followup && (!hits.length || (hits.length===1 && hits[0].id==='templates' && /example|template/.test(normalized)));
      var messageIntent = /\b(template|wording|email|thank you|follow up|outreach)\b/.test(normalized) || /\b(what do i say|how do i (ask|request|decline|accept))\b/.test(normalized) && /\b(offer|deadline|extension|more time)\b/.test(normalized);
      var focus = /\b(wear|dress|attire|outfit|suit|shoes)\b/.test(normalized) ? 'dress' : messageIntent ? 'templates' : /\b(technical)\b/.test(normalized) ? 'technical' : hits.some(function(t){return t.id==='nointernship';}) ? 'nointernship' : null;
      var resumeYear = /\b(freshman|sophomore|junior|senior)\b/.exec(normalized);
      var yearExample = resumeYear && /\b(resume|cv)\b/.test(normalized);
      if (yearExample && !focus) focus = 'resume';
      if (focus && !inherited) explicitSections = [focus].concat(explicitSections.filter(function(id){return id!==focus;}));
      if (inherited) {
        explicitSections = [previous];
        if (Array.isArray(context.terms)) words = Array.from(new Set(words.concat(context.terms.filter(function(t){return typeof t==='string' && frequencies[t];}).slice(0,6))));
        normalized += ' '+words.join(' ');
      }
      if (!words.length && !inherited) return response('clarify','Which part of the career packet would you like to explore?',[],defaults,{});
      var preferExamples = /\b(example|sample|template|wording)\b/.test(normalized);
      var scored = records.map(function(row) {
        var score = 0, matched = 0;
        words.forEach(function(t) {
          if (row.terms.indexOf(t) !== -1) {
            var weight = Math.log(1+records.length/(1+(frequencies[t] || 0)));
            score += weight * (row.bodyTerms.indexOf(t)!==-1?1:0.45);
            if (row.headingTerms.indexOf(t)!==-1) score += weight * 0.65;
            matched++;
          }
        });
        var topicIndex = explicitSections.indexOf(row.section);
        if (topicIndex !== -1) score += 5.0 - Math.min(topicIndex,3)*0.8;
        if (topicIndex === -1 && explicitSections.length) score *= 0.48;
        if (focus && row.section===focus) score += 12;
        if (inherited && row.section===previous) score += 3;
        if (preferExamples && /example|fictional|template|subject|sample/.test(row.normal)) score += 3;
        if (preferExamples && /example/.test(row.id) && (!explicitSections.length || explicitSections.indexOf(row.section)!==-1)) score += 30;
        if (row.section==='dress' && /career fair/.test(normalized) && /Virtual interviews:/.test(row.text)) score -= 10;
        
        if (/\b(star|behavioral)\b/.test(normalized) && row.section==='interviews' && /situation|task|action|result|story/.test(row.normal)) score += 3;
        if (/\b(what|mean|method|framework)\b/.test(normalized) && /\bstar\b/.test(normalized) && row.id==='star-example') score -= 1;
        if (yearExample) {
          var year = resumeYear[0];
          if (row.id==='resume-'+year) score += 48;
          else if (/^resume-(freshman|sophomore|junior|senior)$/.test(row.id)) score -= 40;
        }
        if (/\b(template|email|thank you|follow up|outreach)\b/.test(normalized) && row.section==='templates') score += 3;
        if (row.section==='templates') {
          var templateAnchor = /\b(decline)\b/.test(normalized) ? 'offer-decline' : /\b(accept)\b/.test(normalized) ? 'offer-acceptance' : /\b(extension|more time)\b/.test(normalized) ? 'offer-extension' : /\b(negotiation)\b/.test(normalized) ? 'offer-negotiation' : null;
          if (templateAnchor && (row.id===templateAnchor || templateAnchor==='offer-extension' && /Offer Extension Request/.test(row.heading))) score += 35;
          if (/\b(networking|network|alumni|coffee chat|outreach)\b/.test(normalized) && /Alumni|Coffee Chat/.test(row.heading)) score += 30;
          if (/\b(weekly|manager)\b/.test(normalized) && /Weekly Internship/.test(row.heading)) score += 30;
        }
        if (row.text.length < 55) score *= 0.6;
        if (row.example && !preferExamples) score *= 0.2;
        if (/\bbullet\b/.test(normalized) && row.blueprint) score += 30;
        if (row.section==='coverletter' && /write|build|structure|include/.test(normalized) && row.letter) score += 20;
        if (row.section==='interviews' && /\b(blank|freeze|nervous)\b/.test(normalized) && /mind goes blank/.test(row.normal)) score += 35;
        if (row.section==='interviews' && /ask.*interview|question.*ask|what.*ask/.test(normalized) && row.heading==='Candidate questions') score += 18;
        if (!preferExamples && /\bstar\b/.test(normalized) && /setup brief|80.20 Rule|Building your story bank|Going forward:/.test(row.text)) score += 8;
        if (/\b(quantify|quantif|metric|number|results)\b/.test(normalized) && row.id==='quantify-results') score += 12;
        if (row.section==='checklist' && /resume/.test(normalized) && /how long|length|page/.test(normalized) && /Appropriate length/.test(row.text)) score += 28;
        if (/fictional teaching example|not a replica|fictional phone.stand example/.test(normalize(row.text))) score *= 0.6;
        if (!preferExamples && /\bstar\b/.test(normalized) && /^Use STAR:/.test(row.text)) score += 25;
        if (/\b(what|evaluate|compare)\b/.test(normalized) && row.section==='offer' && /^(Compensation|Housing|Learning|Location|Team|Mentorship)/.test(row.text)) score += 3;
        return {row:row,score:score,matched:matched};
      }).sort(function(a,b){return b.score-a.score;});
      var first = scored[0];
      if (!first || first.score < 3.8 || (!inherited && words.length >= 3 && words.filter(function(t){return frequencies[t];}).length < 2) || (!hits.length && !inherited && (first.matched < 2 || first.matched/Math.max(words.length,1)<0.35))) {
        return response('fallback','I couldn’t find a reliable match in this packet. Try naming a career topic, such as resume bullets, STAR answers, career fairs, or offer negotiation.',[],defaults,{});
      }
      var section = first.row.section;
      // Never turn an unrelated broad match into a confident answer.
      if (!inherited && hits.length > 3 && first.matched < 2) return response('clarify','Which part would you like to focus on first?',[],hits.slice(0,3).map(function(t){return 'Help me with '+t.name;}),{});
      var selected = [], priorTexts = new Set(Array.isArray(context.excerpts) ? context.excerpts : []);
      var candidates = scored.filter(function(item){return item.row.section===section && item.score>=Math.max(3.5,first.score*(inherited && /more|details/.test(normalized) ? 0.3 : 0.65));});
      if (inherited && /\b(more|another|different|details)\b/.test(normalized)) candidates.sort(function(a,b){return Number(priorTexts.has(a.row.text))-Number(priorTexts.has(b.row.text)) || b.score-a.score;});
      candidates.some(function(item) {
        if (!selected.some(function(other){return other.text===item.row.text || other.text.indexOf(item.row.text)!==-1 || item.row.text.indexOf(other.text)!==-1;})) selected.push(item.row);
        return selected.length>=(section==='templates' ? 1 : preferExamples && item.row.id==='star-example' ? 4 : 3);
      });
      var sources = selected.map(function(row){return {id:row.id,title:row.title+(row.heading!==row.title?' — '+row.heading:''),excerpt:shortened(row.text,row.text.indexOf('Subject:')===0?520:350)};});
      var label = TOPICS.find(function(t){return t.id===section;});
      var suggestions = ['Show me an example.','Tell me more.'];
      if (section==='resume') suggestions = ['How can I quantify my results?','Show me a freshman resume example.','What should go in a resume bullet?'];
      if (section==='interviews') suggestions = ['Show me a STAR example.','What should I ask the interviewer?','How do I practice technical interviews?'];
      if (section==='careerfair') suggestions = ['What should I wear?','How do I introduce myself?','Show me a career fair follow-up template.'];
      if (section==='offer') suggestions = ['What should I compare in a full-time offer?','Show me an offer negotiation template.','How do I request more time?'];
      var introduction = selected.some(function(row){return row.example;}) ? 'This is a fictional example from the packet; use your own facts:\n\n' : 'Here’s what the packet says about '+(label?label.name:first.row.title)+':\n\n';
      return response('answer',introduction+sources.map(function(s,index){return '• '+(selected[index].display || s.excerpt);}).join('\n\n'),sources,suggestions,{section:section,terms:words.filter(function(t){return frequencies[t] && !/^(example|sample|template|more|details)$/.test(t);}).slice(0,6),excerpts:selected.map(function(row){return row.text;})});
    }
    return {answer:answer,sections:SECTION_IDS.filter(function(id){return records.some(function(row){return row.section===id;});}),sourceCount:records.length};
  }
  return {create:create,version:'1.1.0'};
}));

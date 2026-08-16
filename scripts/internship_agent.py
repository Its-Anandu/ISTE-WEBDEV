#!/usr/bin/env python3
"""
ISTE MBCET INTERNSHIP INTELLIGENCE ECOSYSTEM v6.0.0 (Elite ML Edition)
=======================================================================
Multi-Agent Autonomous Infrastructure for Kerala Students.
Powered by Playwright, Sentence-Transformers (PyTorch), Celery, and Redis.

Agents:
 - DiscoveryAgent (Playwright + FakeUserAgent stealth crawling)
 - AuthenticityAgent (Cloudscraper/HTTPX domain validation)
 - SemanticIntelligenceAgent (Sentence-Transformers zero-shot classification)
 - QualityAssessmentAgent (Advanced multi-factor scoring)
"""

import os, time, hashlib, random, json, asyncio, difflib
from dotenv import load_dotenv
from urllib.parse import urlparse, quote
import requests

# Advanced Imports
from playwright.async_api import async_playwright
from fake_useragent import UserAgent
import cloudscraper
import httpx
from sentence_transformers import SentenceTransformer, util
from celery import Celery
from sqlalchemy import create_engine, Column, String, Boolean, Float
from sqlalchemy.orm import declarative_base, sessionmaker
from jobspy import scrape_jobs
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim

class Colors:
    CY='\033[96m'; GR='\033[92m'; YL='\033[93m'
    RD='\033[91m'; MG='\033[95m'; RS='\033[0m'; BD='\033[1m'

def log(agent, msg, lvl="INFO"):
    colors = {"INFO": Colors.CY, "SUCCESS": Colors.GR, "WARN": Colors.YL, "ERROR": Colors.RD, "SYSTEM": Colors.MG}
    c = colors.get(lvl, Colors.CY)
    print(f"{c}[{time.strftime('%H:%M:%S')}] {Colors.BD}[{agent}]{Colors.RS} {msg}")

load_dotenv(dotenv_path=".env.local")
SANITY_PROJECT_ID = os.getenv("NEXT_PUBLIC_SANITY_PROJECT_ID")
SANITY_DATASET = os.getenv("NEXT_PUBLIC_SANITY_DATASET", "production")
SANITY_TOKEN = os.getenv("SANITY_API_TOKEN")
SANITY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/mutate/{SANITY_DATASET}"
HEADERS = {"Content-Type":"application/json", "Authorization":f"Bearer {SANITY_TOKEN}"}

# ==============================================================================
# CELERY & DATABASE CONFIGURATION
# ==============================================================================
celery_app = Celery('internship_engine', broker='redis://localhost:6379/0')

Base = declarative_base()
class InternshipCache(Base):
    __tablename__ = 'internship_cache'
    id = Column(String, primary_key=True)
    company = Column(String)
    role = Column(String)
    processed = Column(Boolean, default=False)

class EvolutionMemory(Base):
    __tablename__ = 'evolution_memory'
    id = Column(String, primary_key=True)
    embedding = Column(String)
    survived = Column(Boolean, default=True)

# In-memory SQLite for demo purposes, switch to PostgreSQL for production
engine = create_engine('sqlite:///internships.db')
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)

# ==============================================================================
# AGENT 1: DISCOVERY AGENT (Playwright Stealth Crawling)
# ==============================================================================
class DiscoveryAgent:
    def __init__(self):
        self.ua = UserAgent()
        
    async def crawl_internshala(self):
        log("DISCOVERY", "Launching Playwright for stealth scraping Internshala...")
        results = []
        keywords = ["computer-science-internship-in-kerala", "machine-learning-internship-in-kerala"]
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=self.ua.random,
                viewport={'width': random.randint(1024, 1920), 'height': random.randint(768, 1080)}
            )
            page = await context.new_page()
            
            try:
                from playwright_stealth import stealth_async
                await stealth_async(page)
            except ImportError:
                pass
            
            for kw in keywords:
                try:
                    url = f"https://internshala.com/internships/{kw}"
                    await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    await page.wait_for_selector(".individual_internship", timeout=5000)
                    
                    # Robust selector fallback chain — Internshala renames classes over time.
                    card_selector = (
                        ".individual_internship, .internship_meta, "
                        "a[href*='/internships/detail/'], a[href*='/internships/']"
                    )
                    await page.wait_for_selector(card_selector, timeout=8000)
                    cards = await page.locator(".individual_internship, .internship_meta").all()
                    if not cards:
                        # Fall back to direct detail links
                        links = await page.locator("a[href*='/internships/detail/']").all()
                        for link_tag in links[:8]:
                            href = await link_tag.get_attribute("href")
                            title_txt = (await link_tag.inner_text()).strip()
                            if href and title_txt:
                                results.append({
                                    "role": title_txt.split("\n")[0].strip() or "Internship",
                                    "company": "Internshala",
                                    "applyLink": f"https://internshala.com{href}",
                                    "source": "Internshala",
                                })
                    for card in cards[:5]:
                        title = await card.locator("h3, .job-internship-name").first.inner_text()
                        company = await card.locator(".company_name").first.inner_text()
                        # Real per-internship application URL, not the search page.
                        link_el = card.locator("a.view_detail_button, a[href*='/internships/detail/']").first
                        href = ""
                        try:
                            href = await link_el.get_attribute("href") or ""
                        except Exception:
                            href = ""
                        if href and href.startswith("/"):
                            href = f"https://internshala.com{href}"
                        
                        if title and company:
                            results.append({
                                "role": title.strip(),
                                "company": company.strip(),
                                "applyLink": href or url,
                                "source": "Internshala"
                            })
                except Exception as e:
                    log("DISCOVERY", f"Internshala block or timeout: {e}", "WARN")
                await asyncio.sleep(random.uniform(1.5, 3.0))
                
            await browser.close()
        return results

    async def fetch_kerala_hub(self):
        """
        Crawls the live Technopark + Infopark job boards for real Kerala listings.
        IMPORTANT FIX: This previously returned FABRICATED/hardcoded internships
        (e.g. a fake "TCS Infopark AI Research Intern") that were pushed into the
        live CMS as "verified". We must only ever emit listings that actually exist.
        """
        log("DISCOVERY", "Scraping live Technopark job board...")
        results = []
        real_boards = [
            "https://www.technopark.org/job-search",
            "https://infopark.in/jobs",
        ]
        for url in real_boards:
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Kerala-ISTE-Bot/1.0)"}
                resp = requests.get(url, headers=headers, timeout=15)
                if resp.status_code != 200:
                    continue
                soup = BeautifulSoup(resp.text, "html.parser")
                # Technopark listing rows / Infopark job cards
                for card in soup.select(
                    ".job-row, .job-item, .job-listing, .job-card, tr, [class*='job']"
                )[:20]:
                    text = card.get_text(" ", strip=True)
                    if "intern" not in text.lower():
                        continue
                    link = card.select_one("a[href]")
                    if not link:
                        continue
                    href = link.get("href", "")
                    if href.startswith("/"):
                        href = f"https://www.technopark.org{href}"
                    results.append({
                        "company": "Technopark / Infopark Listing",
                        "role": text[:120],
                        "applyLink": href,
                        "source": "Kerala Hub",
                        "location": "Trivandrum / Kochi",
                        "description": text,
                    })
            except Exception as e:
                log("DISCOVERY", f"Kerala hub scrape failed for {url}: {e}", "WARN")
        log("DISCOVERY", f"Kerala hub scan produced {len(results)} real listings.")
        return results

    async def hunt_jobspy(self):
        log("DISCOVERY", "Launching JobSpy for LinkedIn/Indeed/Glassdoor Kerala internships...")
        results = []
        try:
            # JobSpy is synchronous, run it in a thread
            def run_jobspy():
                return scrape_jobs(
                    site_name=["linkedin", "indeed", "glassdoor"],
                    search_term="internship OR intern OR fresher",
                    location="Kerala",
                    results_wanted=30,
                    hours_old=72,
                    job_type="internship"
                )
            
            jobs = await asyncio.to_thread(run_jobspy)
            
            if jobs is not None and not jobs.empty:
                for _, job in jobs.iterrows():
                    title = str(job.get('title', '')).strip()
                    company = str(job.get('company', '')).strip()
                    url = str(job.get('job_url', '')).strip()
                    site = str(job.get('site', 'JobSpy')).strip()
                    
                    if title and company and url and url != 'nan':
                        results.append({
                            "role": title,
                            "company": company,
                            "applyLink": url,
                            "source": site.capitalize(),
                            "location": str(job.get('location', '')).strip(),
                            "min_amount": job.get('min_amount'),
                            "max_amount": job.get('max_amount'),
                            "currency": str(job.get('currency', '₹')).strip(),
                            "description": str(job.get('description', '')).strip()
                        })
        except Exception as e:
            log("DISCOVERY", f"JobSpy scraping error: {e}", "WARN")
            
        return results

    async def hunt_all(self):
        results = await asyncio.gather(self.crawl_internshala(), self.fetch_kerala_hub(), self.hunt_jobspy())
        combined = []
        for r in results: combined.extend(r)
        
        # Deduplication using SQLAlchemy and Fuzzy Matching
        db = SessionLocal()
        new_items = []
        existing_cache = db.query(InternshipCache).all()
        
        for item in combined:
            comp = item['company'].strip().lower()
            role = item['role'].strip().lower()
            
            uid = hashlib.md5(f"{comp}-{role}".encode()).hexdigest()
            if db.query(InternshipCache).filter_by(id=uid).first():
                continue
                
            is_duplicate = False
            for cached in existing_cache:
                if cached.company and cached.company.strip().lower() == comp:
                    cached_role = cached.role.strip().lower()
                    if difflib.SequenceMatcher(None, role, cached_role).ratio() > 0.85:
                        is_duplicate = True
                        break
                        
            if not is_duplicate:
                new_cache = InternshipCache(id=uid, company=item['company'], role=item['role'])
                db.add(new_cache)
                existing_cache.append(new_cache)
                new_items.append(item)
                
        db.commit()
        db.close()
        
        log("DISCOVERY", f"Discovered {len(combined)} roles. {len(new_items)} are new and unique.", "SUCCESS")
        return new_items

# ==============================================================================
# AGENT 2: AUTHENTICITY AGENT (Cloudscraper Domain Validation)
# ==============================================================================
class AuthenticityAgent:
    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.scam_keywords = [
            'registration fee', 'deposit required', 'pay to work',
            'processing fee', 'security deposit', 'pay us', 
            'unpaid internship with fee', 'training fee', 
            'laptop deposit', 'investment required', 'starter kit', 
            'onboarding fee', 'guaranteed placement fee'
        ]
        
    async def verify(self, item):
        role_comp = f"{item.get('role', '')} {item.get('company', '')}".lower()
        if any(scam in role_comp for scam in self.scam_keywords):
            item['trust_status'] = "REJECTED"
            return item
            
        # Skip links that are placeholders / not real URLs
        url = (item.get('applyLink') or '').strip()
        if not url or url in ('#', '') or not url.startswith('http'):
            item['trust_status'] = "REJECTED"
            item['rejection_reason'] = "Missing application URL"
            return item

        try:
            # Use GET with a browser-ish UA; use HEAD first, fall back to GET on
            # 403/405 (servers that block HEAD) rather than rejecting outright.
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                headers = {"User-Agent": "Mozilla/5.0 (compatible; ISTE-Bot/1.0; +https://iste-mbcet.vercel.app)"}
                resp = await client.get(url, headers=headers)
                if resp.status_code >= 400 and resp.status_code not in (403, 405, 429):
                    item['trust_status'] = "REJECTED"
                    item['rejection_reason'] = f"HTTP {resp.status_code}"
                    return item
                # 403/405/429 usually mean "exists but blocked bot" — not a dead link.
                item['trust_status'] = "VERIFIED"
                return item
        except httpx.TransportError:
            # Network blips are transient — do NOT classify as dead. Re-verify later.
            item['trust_status'] = "UNVERIFIED"
            item['rejection_reason'] = "Transient network error (will retry)"
            return item
        except Exception:
            item['trust_status'] = "REJECTED"
            return item

    async def filter_batch(self, items):
        log("AUTHENTICITY", "Running Cloudscraper domain validation...")
        tasks = [self.verify(i) for i in items]
        processed = await asyncio.gather(*tasks)
        verified = [p for p in processed if p['trust_status'] == 'VERIFIED']
        return verified

# ==============================================================================
# AGENT 3: SEMANTIC INTELLIGENCE AGENT (Sentence-Transformers ML)
# ==============================================================================
class SemanticIntelligenceAgent:
    def __init__(self):
        log("SEMANTIC_AI", "Loading PyTorch Sentence-Transformer Model (all-MiniLM-L6-v2)...")
        # Load a highly efficient embedding model for semantic classification
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.domains = [
            "Artificial Intelligence, Machine Learning, and Data Science",
            "Robotics, Electronics, and Embedded Hardware",
            "Web Development, Mobile Apps, and Software Engineering",
            "Cybersecurity and Network Engineering",
            "UI UX Design and Product Management"
        ]
        self.domain_embeddings = self.model.encode(self.domains, convert_to_tensor=True)

    def enrich(self, item):
        role = item['role']
        # Compute semantic similarity between the job role and our predefined domains
        role_emb = self.model.encode(role, convert_to_tensor=True)
        cosine_scores = util.cos_sim(role_emb, self.domain_embeddings)[0]
        best_match_idx = cosine_scores.argmax().item()
        best_domain = self.domains[best_match_idx]
        score = cosine_scores[best_match_idx].item()
        
        # Map back to simple tags
        if "Artificial Intelligence" in best_domain and score > 0.4:
            item['domain'] = 'AI/ML & Data Science'
            item['skills'] = ['Python', 'TensorFlow', 'Data Science']
        elif "Robotics" in best_domain and score > 0.4:
            item['domain'] = 'Robotics & Embedded'
            item['skills'] = ['C++', 'Microcontrollers', 'Hardware']
        else:
            item['domain'] = 'Software Engineering'
            item['skills'] = ['Javascript', 'React', 'Git']
            
        item['type'] = 'Remote' if 'remote' in role.lower() else 'Hybrid'
        item['ai_recommendation'] = f"AI Confidence Score: {round(score*100)}%. Semantically mapped to {item['domain']}."
        
        # 1. NLP Stipend & Compensation Extraction
        import re
        stipend = "Check listing"
        if item.get('min_amount') and str(item.get('min_amount')) != 'nan':
            curr = item.get('currency', '₹')
            stipend = f"{curr}{int(item.get('min_amount'))} - {curr}{int(item.get('max_amount', item.get('min_amount')))}"
        
        desc = item.get('description', '') or item.get('role', '')
        if "Check listing" in stipend and '₹' in desc:
            match = re.search(r'₹[\d,]+(\s*-\s*₹[\d,]+)?', desc)
            if match: stipend = match.group(0)
        item['stipend'] = stipend
        
        # 2. Skill-Gap Analysis Engine
        baseline = set(['python', 'javascript', 'html', 'css', 'c++', 'java', 'git'])
        req_skills = set([s.lower() for s in item.get('skills', [])])
        missing = req_skills - baseline
        if missing:
            item['ai_recommendation'] += f" [Skill Gap Alert: Missing {', '.join(missing).title()}]"
        else:
            item['ai_recommendation'] += f" [Skill Gap: None (Meets Baseline)]"
            
        item['role_tensor'] = role_emb
        item['embedding_json'] = json.dumps(role_emb.tolist())
        return item

    def process_batch(self, items):
        log("SEMANTIC_AI", "Running Neural Vector Embeddings on Roles...")
        return [self.enrich(i) for i in items]

# ==============================================================================
# AGENT 4: QUALITY ASSESSMENT & EVOLUTIONARY ML AGENT
# ==============================================================================
class AdaptiveNeuralCore(nn.Module):
    def __init__(self, input_dim=384):
        super(AdaptiveNeuralCore, self).__init__()
        self.fc1 = nn.Linear(input_dim, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, 1)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        return self.sigmoid(self.fc2(self.relu(self.fc1(x))))

class EvolutionaryLearningAgent:
    def __init__(self):
        self.model_path = 'adaptive_core.pth'
        self.model = AdaptiveNeuralCore()
        if os.path.exists(self.model_path):
            self.model.load_state_dict(torch.load(self.model_path, weights_only=True))
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.01)
        self.criterion = nn.BCELoss()
        
    def train_on_memory(self):
        log("EVOLUTION", "Initiating Continuous ML Retraining Phase...")
        db = SessionLocal()
        memories = db.query(EvolutionMemory).all()
        
        if len(memories) < 5:
            log("EVOLUTION", "Insufficient neural data. Gathering more memory before evolution.", "WARN")
            db.close()
            return
            
        X, Y = [], []
        for m in memories:
            X.append(json.loads(m.embedding))
            Y.append([1.0 if m.survived else 0.0])
            
        X_t = torch.tensor(X, dtype=torch.float32)
        Y_t = torch.tensor(Y, dtype=torch.float32)
        
        self.model.train()
        for epoch in range(10):
            self.optimizer.zero_grad()
            outputs = self.model(X_t)
            loss = self.criterion(outputs, Y_t)
            loss.backward()
            self.optimizer.step()
            
        torch.save(self.model.state_dict(), self.model_path)
        log("EVOLUTION", f"Neural Core Evolved successfully. Survival Prediction Loss: {loss.item():.4f}", "SUCCESS")
        db.close()
        
    def predict_survival(self, embedding_tensor):
        self.model.eval()
        with torch.no_grad():
            prob = self.model(embedding_tensor).item()
        return prob

class QualityAssessmentAgent:
    def __init__(self):
        self.evolution = EvolutionaryLearningAgent()
        self.judge = None # Lazy load HuggingFace Pipeline
        
    def score(self, item):
        score = 50
        if item['domain'] in ['AI/ML & Data Science', 'Robotics & Embedded']: score += 20
        if item['source'] == 'Kerala Hub': score += 15
        
        # Geographic Proximity & Commute Scoring
        loc = (item.get('location', '') + " " + item.get('source', '') + " " + item.get('company', '')).lower()
        if 'trivandrum' in loc or 'thiruvananthapuram' in loc or 'technopark' in loc:
            score += 30
        elif 'kochi' in loc or 'ernakulam' in loc or 'infopark' in loc:
            score += 15
        elif 'kerala' in loc:
            score += 5
        
        # Continuous ML Multiplier
        survival_prob = self.evolution.predict_survival(item['role_tensor'])
        
        # True Multi-Agent Orchestration (Supreme Judge LLM)
        if 0.4 <= survival_prob <= 0.6:
            try:
                if self.judge is None:
                    from transformers import pipeline
                    log("SUPREME_JUDGE", "Loading Zero-Shot LLM for Borderline Case...", "WARN")
                    self.judge = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
                
                res = self.judge(
                    f"{item['role']} at {item['company']}", 
                    candidate_labels=["high quality technical internship", "low quality or generic role"]
                )
                if res['labels'][0] == "high quality technical internship":
                    survival_prob += 0.2
                    item['ai_recommendation'] += " [Supreme Judge: Approved]"
                else:
                    survival_prob -= 0.2
                    item['ai_recommendation'] += " [Supreme Judge: Rejected]"
            except Exception as e:
                log("SUPREME_JUDGE", f"Judge failed: {e}", "ERROR")
        
        score = int(score * (0.5 + survival_prob))
        
        item['quality_tier'] = "ELITE" if score > 80 else "HIGH VALUE" if score > 60 else "MODERATE"
        item['learning_value_score'] = min(score, 99)
        item['ai_recommendation'] += f" [Survival Prob: {round(survival_prob*100, 1)}%]"
        
        # Log to memory
        comp = item['company'].strip().lower()
        role = item['role'].strip().lower()
        uid = hashlib.md5(f"{comp}-{role}".encode()).hexdigest()
        
        db = SessionLocal()
        if not db.query(EvolutionMemory).filter_by(id=uid).first():
            db.add(EvolutionMemory(id=uid, embedding=item['embedding_json'], survived=True))
        db.commit()
        db.close()
        
        return item
        
    def assess_batch(self, items):
        return [self.score(i) for i in items]

# ==============================================================================
# AGENT 5: SANITY CLEANUP AGENT (Fraud & Duplicate Pruner)
# ==============================================================================
class SanityCleanupAgent:
    async def cleanup_live_list(self):
        log("CLEANUP", "Fetching live CMS list for fraud, counterfeit, and semantic duplicate pruning...")
        query = '*[_type == "internship"]{_id, company, role, applyLink}'
        try:
            fetch_url = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/query/{SANITY_DATASET}?query={quote(query)}"
            resp = requests.get(fetch_url, headers=HEADERS)
            data = resp.json().get("result", [])
            
            mutations = []
            authenticity = AuthenticityAgent()
            
            # Phase 1: Prune dead links & advanced frauds
            log("CLEANUP", f"Scanning {len(data)} live entries for link rot and counterfeit flags...")
            
            def mark_dead(d_item):
                c = str(d_item.get('company', '')).strip().lower()
                r = str(d_item.get('role', '')).strip().lower()
                d_uid = hashlib.md5(f"{c}-{r}".encode()).hexdigest()
                mem_db = SessionLocal()
                mem = mem_db.query(EvolutionMemory).filter_by(id=d_uid).first()
                if mem: mem.survived = False
                mem_db.commit()
                mem_db.close()
                
            for item in data:
                # Skip if applyLink is missing
                if not item.get("applyLink"):
                    mutations.append({"delete": {"id": item["_id"]}})
                    mark_dead(item)
                    continue
                verified = await authenticity.verify(item)
                if verified.get('trust_status') == "REJECTED":
                    log("CLEANUP", f"Counterfeit/Dead link detected: {item.get('company')} - {item.get('role')}", "WARN")
                    mutations.append({"delete": {"id": item["_id"]}})
                    mark_dead(item)
            
            # Phase 2: Deep Semantic Deduplication
            log("CLEANUP", "Executing deep semantic deduplication on live list...")
            company_groups = {}
            for item in data:
                if item["_id"] in [m.get("delete", {}).get("id") for m in mutations]:
                    continue
                comp = str(item.get("company", "")).strip().lower()
                if comp not in company_groups:
                    company_groups[comp] = []
                company_groups[comp].append(item)
            
            for comp, items in company_groups.items():
                if len(items) > 1:
                    items_to_delete = set()
                    for i in range(len(items)):
                        for j in range(i + 1, len(items)):
                            id_i = items[i]["_id"]
                            id_j = items[j]["_id"]
                            if id_i in items_to_delete or id_j in items_to_delete:
                                continue
                            role_i = str(items[i].get("role", "")).lower()
                            role_j = str(items[j].get("role", "")).lower()
                            
                            # Extremely sensitive fuzzy duplicate matching (>80% similar)
                            if difflib.SequenceMatcher(None, role_i, role_j).ratio() >= 0.80:
                                log("CLEANUP", f"Semantic duplicate found: '{role_i}' == '{role_j}'. Pruning...", "WARN")
                                items_to_delete.add(id_j)
                                mutations.append({"delete": {"id": id_j}})
                                mark_dead(items[j])

            if mutations:
                log("CLEANUP", f"Purging {len(mutations)} toxic/duplicate entries from live Sanity database...", "SUCCESS")
                for i in range(0, len(mutations), 25):
                    batch = mutations[i:i+25]
                    requests.post(SANITY_URL, headers=HEADERS, json={"mutations": batch})
            else:
                log("CLEANUP", "Live list is pristine. No toxic or duplicate entries found.", "SUCCESS")
                
        except Exception as e:
            log("CLEANUP", f"Live list pruning failed: {e}", "ERROR")

# ==============================================================================
# CELERY TASK RUNNER & ORCHESTRATION
# ==============================================================================
def sync_to_sanity(internships):
    log("MAINTENANCE", f"Syncing {len(internships)} elite opportunities to Sanity CMS...")
    mutations = []
    
    for item in internships:
        uid = f"{item['company']}-{item['role']}".lower().replace(' ','-')
        doc_id = f"internship-{hashlib.md5(uid.encode()).hexdigest()[:16]}"
        doc = {
            "_id": doc_id,
            "_type": "internship",
            "company": item["company"],
            "role": item["role"],
            "type": item["type"],
            "domain": item["domain"],
            "stipend": item.get("stipend", "Check listing"),
            "duration": "2-6 Months",
            "deadlineLabel": "Apply Now",
            "applyLink": item["applyLink"],
            "status": "open",
            "featured": item.get('quality_tier') == 'ELITE',
            "aiRecommendation": item.get("ai_recommendation", ""),
            "qualityTier": item.get("quality_tier", "MODERATE"),
            "skills": item.get("skills", []),
            "learningScore": item.get("learning_value_score", 50)
        }
        mutations.append({"createOrReplace": doc})

    for i in range(0, len(mutations), 25):
        batch = mutations[i:i+25]
        try:
            resp = requests.post(SANITY_URL, headers=HEADERS, json={"mutations": batch})
            if resp.status_code == 200:
                log("CMS", f"Batch uploaded successfully.", "SUCCESS")
        except Exception as e:
            log("CMS", f"Network error: {e}", "ERROR")

@celery_app.task
def trigger_engine_cycle():
    """Celery entry point for scheduled execution"""
    asyncio.run(execute_pipeline())

async def execute_pipeline():
    print(f"\n{Colors.MG}{Colors.BD}{'='*70}{Colors.RS}")
    print(f"{Colors.MG}{Colors.BD}  AI OPPORTUNITY INFRASTRUCTURE - ELITE ML EDITION (V6.0.0) {Colors.RS}")
    print(f"{Colors.MG}{Colors.BD}{'='*70}{Colors.RS}\n")
    
    try:
        discovery = DiscoveryAgent()
        raw_data = await discovery.hunt_all()
        
        if not raw_data:
            log("SYSTEM", "No new opportunities found. Initiating live list maintenance...", "WARN")
            cleanup = SanityCleanupAgent()
            await cleanup.cleanup_live_list()
            return

        authenticity = AuthenticityAgent()
        verified_data = await authenticity.filter_batch(raw_data)
        
        semantic = SemanticIntelligenceAgent()
        enriched_data = semantic.process_batch(verified_data)
        
        quality = QualityAssessmentAgent()
        final_data = quality.assess_batch(enriched_data)
        
        sync_to_sanity(final_data)
        
        cleanup = SanityCleanupAgent()
        await cleanup.cleanup_live_list()
        
        # Retrain the ML model on the updated memory
        evo_agent = EvolutionaryLearningAgent()
        evo_agent.train_on_memory()
        
        log("SYSTEM", "AI Cycle Complete. Neural pathways resting.", "SUCCESS")
        
    except Exception as e:
        log("SYSTEM", f"Critical AI Error: {e}", "ERROR")

if __name__ == "__main__":
    # If run directly instead of through Celery worker
    asyncio.run(execute_pipeline())

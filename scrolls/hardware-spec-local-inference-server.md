# Hardware Specification & Strategy Guide: Local AI Inference Server

**Target Use Case:** Dedicated headless inference node for Dungeonmaster agent orchestration (`codeweaver`,
`flowrider`).  
**Client/Server Topology:** Host machine (HP Elite Mini 800 G9 running dev tools, git worktrees, ward testbed, and
orchestrator) dispatches inference requests over home LAN (HTTP/OpenAI-compatible API) to a dedicated local server.  
**Procurement Constraint:** **Brand New Only** (no used or refurbished marketplace components).

---

## 1. The Real Context Footprint: Multi-Pair Companion Sets

In standard coding tasks, context stays around 30k–40k tokens. However, in this codebase, agents do not write isolated
single files—they produce and modify **companion sets**:

* **Implementation** (e.g. `broker`, `transformer`, `widget`)
* **Unit/Integration Tests** (`.test.ts`)
* **Test Proxies / Stubs** (`.proxy.ts`, `.stub.ts`)
* **Branded Contracts** (`-contract.ts`)

When an agent writes or refactors two pairs (6 to 8 files) and enters the self-healing `npm run ward` feedback loop,
context accumulates rapidly:

| Phase of the Agent Loop                                                                                              | Token Accumulation            |
|:---------------------------------------------------------------------------------------------------------------------|:------------------------------|
| **1. Base Standards & Patterns** (`get-architecture`, `get-testing-patterns`, folder details, package statics)       | ~25,000 – 30,000 tokens       |
| **2. Upstream References** (reading related contracts, existing stubs, and callers)                                  | ~15,000 – 20,000 tokens       |
| **3. File Writes** (2 pairs = 6 to 8 files: implementations, tests, proxies, stubs)                                  | ~12,000 – 20,000 tokens       |
| **4. Ward Iteration Loop** (`npm run ward` output, typecheck errors, test failures, and diffs across 2–3 fix cycles) | ~20,000 – 30,000 tokens       |
| **5. Model Chain-of-Thought** (thinking tokens accumulated across multiple generations)                              | ~8,000 – 12,000 tokens        |
| **REALISTIC WORKING CONTEXT PER WORKER**                                                                             | **80,000 to 110,000+ tokens** |

---

## 2. KV Cache Scaling & Memory Realities at 100k Context

At 100k tokens, the Key-Value (KV) cache memory demand dominates the GPU. For Qwen 27B / 32B attention architectures at
**100,000 tokens**:

* **FP16 KV Cache (Unquantized):** **24.4 GB per worker**
* **Q8 KV Cache (`q8_0`):** **12.2 GB per worker**
* **Q4 KV Cache (`q4_0`):** **6.1 GB per worker**

$$\text{Total AI Memory} = \text{Model Weights} + (\text{Active Workers} \times \text{KV Cache per Worker})$$

### What This Means Across Hardware Tiers:

1. **Single 16 GB Card:** **Dead on Arrival.** A dense 27B model (17.5 GB) cannot even load. Even with Bonsai 2 (6.5
   GB), a single 100k worker pushes memory to 12.6 GB, leaving zero room for a second worker or KV expansion.
2. **Dual 16 GB Cards (32 GB Total VRAM):**
    * **Dense 27B:** $17.5\text{ GB (weights)} + 2 \times 6.1\text{ GB (Q4 cache)} = \mathbf{29.7\text{ GB}}$. Redlines
      the cards at **only 1 or 2 workers max**.
    * **Bonsai 2 27B:** $6.5\text{ GB (weights)} + 4 \times 6.1\text{ GB (Q4 cache)} = \mathbf{30.9\text{ GB}}$. Fits
      **3 to 4 parallel workers**.
3. **48 GB to 64 GB AI Memory (Mac Studio 64GB or 3× GPUs):**
    * The required threshold to comfortably run **4 to 6 parallel workers** at 100k context without constant
      out-of-memory risks.

---

## 3. Understanding PCIe Bus Bottlenecks vs. Independent GPU Instances

There is often confusion around when context travels across the PCIe bus:

### Scenario A: GPU + System RAM Offloading (`--no-kv-offload`)

* Model weights live in GPU VRAM (fast tensor math).
* The 100k KV cache buffer lives in **Motherboard DDR5 RAM**.
* **The Bottleneck:** To predict every single token, the GPU must inspect the entire 100k history. Because that history
  lives on the motherboard, gigabytes of data must travel **across the PCIe slot on every token**.
* **Result:** Generation speed drops from ~35 tok/s to **~6–10 tok/s**.

### Scenario B: Multi-GPU with Bonsai 2 27B (Independent Instances)

Because Bonsai 2's weights are compressed to **6.5 GB**, one full copy of the model fits on a single 16GB card:

* **GPU 1 (16 GB):** Model (6.5 GB) + Worker 1 Context (6.1 GB) = 12.6 GB VRAM (Port 8000)
* **GPU 2 (16 GB):** Model (6.5 GB) + Worker 2 Context (6.1 GB) = 12.6 GB VRAM (Port 8001)
* **Zero Context Crosses PCIe:** Each card operates as a fully independent inference node. Each worker gets 100% of that
  card's unthrottled memory bandwidth (~40+ tok/s) with zero inter-card bus traffic.

---

## 4. Do You Need a Single "32GB Card" for Logic Processing?

**No.** A single brand-new 32GB graphics card (like the RTX 5090) currently costs **$5,000+** due to AI data-center
supply diversion.

You can achieve high-level logic and reasoning without buying a single 32GB card through three distinct paths:

1. **The 14B Reasoning Route (DeepSeek-R1-Distill-14B):**
    * Weights: **8.5 GB**.
    * Designed specifically for deep chain-of-thought logic. Beats older 70B models on reasoning and code debugging.
    * Fits on a **single 16GB card** with 80k context.
2. **Two 16GB Cards Pooled (32 GB Total VRAM):**
    * Costs ~$1,560 for two cards (e.g. 2× RTX 5060 Ti 16GB).
    * Runs a full dense 27B/32B model split across both cards (`16GB + 16GB`).
3. **Apple Mac Studio (48GB–64GB Unified Memory):**
    * Costs ~$2,000–$2,200 brand new.
    * Provides a single, contiguous **~48 GB usable VRAM pool** in one box. Runs 32B models at 100k context without any
      multi-GPU layer splitting.

---

## 5. Model Testing Playbook: Test Before Buying Hardware

Before committing $2,000+ to hardware, test the candidate models against your actual repository tasks for **under $
2.00**.

### Method 1: Serverless API via OpenRouter (Fastest & Easiest)

Bonsai 2 27B, Qwen Coder, and DeepSeek-R1 are already hosted on [OpenRouter](https://openrouter.ai):

1. Create an account and add $5 in credit.
2. Get an API key (fully OpenAI-compatible).
3. Test candidate models directly via curl or your agent runner:
    * `prismml/bonsai-2-27b`
    * `qwen/qwen-2.5-coder-32b-instruct`
    * `deepseek/deepseek-r1-distill-qwen-14b`
    * `deepseek/deepseek-r1-distill-qwen-32b`

### Method 2: Hourly Cloud GPU Rental (RunPod / Vast.ai)

Rent an RTX 4090 (24GB) or A100 (80GB) for **~$0.40 to $0.70 / hour**:

1. Spin up an Ubuntu PyTorch pod on RunPod.
2. Clone `llama.cpp-bonsai` and download the GGUF.
3. Launch the server with `--ctx-size 80000 --parallel 2`.
4. Test live token speeds and memory behavior.

### What to Grade the Models On:

* **The `ban-primitives` Test:** Does it return branded types parsed through Zod contracts (e.g.,
  `dagNodeIdContract.parse(...)`), or does it fall into default LLM habits (`as unknown as`, raw strings/numbers)?
* **Zero Magic Numbers:** Does it import ports, timeouts, and constants from `statics/`, or does it inline raw numbers?
* **Companion Discipline:** When instructed to write an implementation, does it correctly structure the companion
  `.test.ts`, `.proxy.ts`, and contracts?
* **Self-Healing on Ward Failures:** When fed an `npm run ward` error trace, does it reason through the architectural
  failure and fix it cleanly, or does it attempt linter evasions (`any`, `// eslint-disable`)?

---

## 6. Hardware Procurement Comparison (Brand New)

| Metric                           | Dual-GPU PC Tower (2× RTX 5060 Ti)             | Apple Mac Studio (64GB Unified)             |
|:---------------------------------|:-----------------------------------------------|:--------------------------------------------|
| **Total Brand-New Cost**         | **~$2,665** *(Base PC $1,105 + 2 GPUs $1,560)* | **~$2,000 – $2,200** *(Turnkey appliance)*  |
| **Total Usable AI Memory**       | **32 GB** *(Split across two 16GB cards)*      | **~48 GB to 50 GB** *(Single unified pool)* |
| **Cost per GB of AI Memory**     | **~$83 / GB**                                  | **~$43 / GB**                               |
| **Max 100k Workers (Bonsai 2)**  | **3 to 4 Parallel Workers**                    | **6 to 7 Parallel Workers**                 |
| **Max 100k Workers (Dense 27B)** | **1 to 2 Parallel Workers** *(Redlining)*      | **4 to 5 Parallel Workers**                 |
| **Token Generation Speed**       | **Fast (~45–55 tok/s)**                        | **Moderate (~30–35 tok/s)**                 |
| **Ecosystem & Drivers**          | **Native NVIDIA CUDA** (Zero friction)         | **Apple Metal / MLX**                       |
| **Power Consumption & Noise**    | ~500W–600W under load; 36 dB fans              | **~75W–85W under load; inaudible (<22 dB)** |
| **Upgradability**                | 100% modular (replace GPUs in 3 years)         | 0% modular (soldered chip)                  |

---

## 7. Recommended Action Plan

1. **Step 1 (Testing Phase):** Spend $2 on OpenRouter / RunPod. Feed a multi-pair `codeweaver` task to **Bonsai 2 27B**,
   **DeepSeek-R1-14B**, and **Qwen-Coder-32B**. Run `npm run ward` against their outputs.
2. **Step 2 (Hardware Decision):**
    * If **Bonsai 2 27B or DeepSeek-R1-14B** passes your tests with high reliability, the **Dual-GPU PC Tower (starting
      with 1× 16GB card @ ~$1,885)** is a viable modular option.
    * If you need the uncompressed reasoning of **Dense 27B/32B models across 3+ parallel workers at 100k context**, the
      **Apple Mac Studio 64GB (~$2,100)** is the undisputed champion of price-per-gigabyte, physical quietness, and
      memory capacity.

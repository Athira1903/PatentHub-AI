import assert from 'assert';
import { AiService } from './src/services/aiService';
import { ClaimAiService } from './src/services/claimAiService';
import { FtoAnalysisService } from './src/services/ftoAnalysisService';

async function runAiResilienceTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING AI RESILIENCE & HEURISTIC FALLBACK TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ❌ [FAIL] ${name}:`, err.message);
            failed++;
          });
      } else {
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Test Innovation Suggestions Fallback
  await test('AiService.generateInnovationSuggestions generates structured titles without crashing', async () => {
    const titles = await AiService.generateInnovationSuggestions(
      'Smart Ingestor System',
      'INVENTION',
      'Distributed Systems',
      'High latency and packet drops during stream processing',
      'Decentralized feedback queues with self-balancing workers',
      'title'
    );
    assert.ok(titles.length > 0, 'Titles generated');
    assert.ok(titles.includes('Smart Ingestor System'), 'Contains invention title');
  });

  await test('AiService.generateInnovationSuggestions generates patent-compliant abstract', async () => {
    const abstract = await AiService.generateInnovationSuggestions(
      'Smart Ingestor System',
      'INVENTION',
      'Distributed Systems',
      'High latency and packet drops during stream processing',
      'Decentralized feedback queues with self-balancing workers',
      'abstract'
    );
    assert.ok(abstract.length > 50, 'Abstract generated with substantial content');
    assert.ok(abstract.includes('disclosed'), 'Follows patent abstract conventions');
  });

  await test('AiService.generateInnovationSuggestions generates claims', async () => {
    const claims = await AiService.generateInnovationSuggestions(
      'Smart Ingestor System',
      'INVENTION',
      'Distributed Systems',
      'High latency and packet drops during stream processing',
      'Decentralized feedback queues with self-balancing workers',
      'claims'
    );
    assert.ok(claims.includes('1. An automated system'), 'Includes independent claim 1');
    assert.ok(claims.includes('claim 1'), 'Includes dependent claims');
  });

  // 2. Test Similarity Analysis Fallback
  await test('AiService.analyzeSimilarity returns structured similarity analysis with references', async () => {
    const refs = [
      {
        patentNumber: 'US10999999B2',
        title: 'Distributed Queue Architecture',
        abstract: 'A distributed queue balancing message pipelines.',
        url: 'https://patents.google.com/patent/US10999999B2'
      }
    ];
    const res = await AiService.analyzeSimilarity(
      'Smart Ingestor System',
      'INVENTION',
      'Distributed Systems',
      'High latency and packet drops during stream processing',
      'Decentralized feedback queues with self-balancing workers',
      refs
    );
    assert.strictEqual(typeof res.score, 'number');
    assert.ok(res.score >= 0 && res.score <= 100);
    assert.ok(['Low Risk', 'Medium Risk', 'High Risk'].includes(res.riskLevel));
    assert.ok(res.matchingConcepts.length > 0);
    assert.ok(res.disclaimer.includes('AI-assisted conceptual comparison'));
  });

  // 3. Test Novelty Assessment Fallback
  await test('AiService.assessNovelty returns structured novelty assessment', async () => {
    const refs = [
      {
        patentNumber: 'US10999999B2',
        title: 'Distributed Queue Architecture',
        abstract: 'A distributed queue balancing message pipelines.'
      }
    ];
    const res = await AiService.assessNovelty(
      'Smart Ingestor System',
      'INVENTION',
      'Distributed Systems',
      'High latency and packet drops during stream processing',
      'Decentralized feedback queues with self-balancing workers',
      refs
    );
    assert.strictEqual(typeof res.score, 'number');
    assert.ok(['High', 'Medium', 'Low'].includes(res.assessment));
    assert.ok(res.strongAreas.length > 0);
    assert.ok(res.weakAreas.length > 0);
    assert.ok(res.recommendations.length > 0);
  });

  // 4. Test Patent Drawing Analysis Fallback
  await test('AiService.generatePatentDrawingAnalysis returns FIG numbering and numbered components', async () => {
    const res = await AiService.generatePatentDrawingAnalysis(
      'Smart Ingestor System',
      'High latency during stream processing',
      'Decentralized feedback queues'
    );
    assert.strictEqual(res.figNum, 'FIG. 1');
    assert.ok(res.components.length >= 3);
    assert.strictEqual(res.components[0].number, '100');
  });

  // 5. Test Chat With Project Assistant Fallback
  await test('AiService.chatWithProjectAssistant answers claims questions with project context', async () => {
    const context = {
      title: 'Autonomous Drone Navigation',
      technicalDomain: 'Robotics & UAV',
      stage: 'DOCUMENTATION',
      filingReadiness: 65,
      innovationIdea: 'GPS-denied navigation in underground environments',
      proposedSolution: 'Multi-spectral LiDAR fusion with local visual odometry',
      claims: [
        { claimNumber: 1, claimType: 'INDEPENDENT', body: 'An autonomous unmanned aerial vehicle comprising a multispectral lidar sensor...' },
        { claimNumber: 2, claimType: 'DEPENDENT', body: 'The vehicle of claim 1, further comprising an inertial measurement unit...' }
      ]
    };

    const res = await AiService.chatWithProjectAssistant(context, 'How are my claims? How can I improve them?');
    console.log('REPLY FOR CLAIMS:', res.reply);
    assert.ok(res.reply.length > 50);
    assert.ok(res.reply.includes('Autonomous Drone Navigation'));
    assert.ok(res.reply.includes('Patent Claims Analysis'));
    assert.ok(res.reply.includes('claim(s)** drafted'));
    assert.ok(res.reply.includes('PatentHub Intelligence Engine'));
  });

  await test('AiService.chatWithProjectAssistant answers filing readiness and next steps', async () => {
    const context = {
      title: 'Autonomous Drone Navigation',
      technicalDomain: 'Robotics & UAV',
      stage: 'DOCUMENTATION',
      filingReadiness: 65,
      innovationIdea: 'GPS-denied navigation in underground environments',
      proposedSolution: 'Multi-spectral LiDAR fusion with local visual odometry',
      claims: []
    };

    const res = await AiService.chatWithProjectAssistant(context, 'What is my filing readiness and what are my next steps?');
    assert.ok(res.reply.includes('65%'));
    assert.ok(res.reply.includes('DOCUMENTATION'));
    assert.ok(res.reply.includes('Next Recommended Steps'));
  });

  await test('AiService.chatWithProjectAssistant answers executive summary inquiry', async () => {
    const context = {
      title: 'Autonomous Drone Navigation',
      technicalDomain: 'Robotics & UAV',
      stage: 'IDEA',
      filingReadiness: 20,
      innovationIdea: 'GPS-denied navigation in underground environments',
      proposedSolution: 'Multi-spectral LiDAR fusion with local visual odometry'
    };

    const res = await AiService.chatWithProjectAssistant(context, 'Can you summarize this project?');
    assert.ok(res.reply.includes('Autonomous Drone Navigation'));
    assert.ok(res.reply.includes('Robotics & UAV'));
    assert.ok(res.reply.includes('Multi-spectral LiDAR fusion'));
  });

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAiResilienceTests().catch((e) => {
  console.error(e);
  process.exit(1);
});

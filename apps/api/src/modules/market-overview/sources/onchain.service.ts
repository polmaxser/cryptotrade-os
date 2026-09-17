import { Injectable, Logger } from '@nestjs/common';

import { OnChainData } from '../types/market-overview-data';

const STATS_URL = 'https://api.blockchain.info/stats';

interface BlockchainInfoStats {
  hash_rate: number;
  difficulty: number;
  estimated_transaction_volume_usd: number;
  n_tx: number;
}

const MEMPOOL_URL = 'https://api.blockchain.info/charts/mempool-size?timespan=1days&format=json';

interface MempoolChart {
  values: Array<{ y: number }>;
}

/** Bitcoin on-chain network stats — free, no key, from blockchain.info. */
@Injectable()
export class OnChainService {
  private readonly logger = new Logger(OnChainService.name);

  async fetch(): Promise<OnChainData | null> {
    const [stats, mempool] = await Promise.all([this.fetchStats(), this.fetchMempoolSize()]);

    if (stats === null && mempool === null) return null;

    return {
      hashRate: stats?.hash_rate ?? null,
      difficulty: stats?.difficulty ?? null,
      mempoolSizeBytes: mempool,
      estimatedTxVolumeUsd: stats?.estimated_transaction_volume_usd ?? null,
      transactionCount: stats?.n_tx ?? null,
    };
  }

  private async fetchStats(): Promise<BlockchainInfoStats | null> {
    try {
      const response = await fetch(STATS_URL);
      if (!response.ok) throw new Error(`status ${response.status}`);
      return (await response.json()) as BlockchainInfoStats;
    } catch (err) {
      this.logger.warn(`Failed to fetch blockchain.info stats: ${(err as Error).message}`);
      return null;
    }
  }

  private async fetchMempoolSize(): Promise<number | null> {
    try {
      const response = await fetch(MEMPOOL_URL);
      if (!response.ok) throw new Error(`status ${response.status}`);

      const payload = (await response.json()) as MempoolChart;
      const latest = payload.values[payload.values.length - 1];
      return latest ? latest.y : null;
    } catch (err) {
      this.logger.warn(`Failed to fetch mempool size: ${(err as Error).message}`);
      return null;
    }
  }
}

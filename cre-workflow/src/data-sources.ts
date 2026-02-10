/**
 * Data source integrations for PhantomBet CRE Workflow
 */

import type { DataSource, NewsAPIResponse } from './types.js';

export class DataSourceClient {
    private newsApiKey: string;
    private sportsDataApiKey: string;

    constructor(newsApiKey: string, sportsDataApiKey: string) {
        this.newsApiKey = newsApiKey;
        this.sportsDataApiKey = sportsDataApiKey;
    }

    /**
     * Fetch news articles related to the market question
     */
    async fetchNewsAPI(query: string): Promise<DataSource> {
        try {
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&apiKey=${this.newsApiKey}`;

            const response = await fetch(url);
            const data = await response.json() as NewsAPIResponse;

            if (data.status !== 'ok') {
                throw new Error(`NewsAPI error: ${data.status}`);
            }

            // Aggregate article content
            const articles = data.articles
                .slice(0, 5)
                .map(article => `${article.title}: ${article.description}`)
                .join('\n\n');

            return {
                name: 'NewsAPI',
                data: articles,
                confidence: 0.8,
                timestamp: Date.now(),
            };
        } catch (error) {
            console.error('Error fetching NewsAPI:', error);
            return {
                name: 'NewsAPI',
                data: 'Error fetching news data',
                confidence: 0,
                timestamp: Date.now(),
            };
        }
    }

    /**
     * Fetch sports data (placeholder for demo)
     */
    async fetchSportsData(query: string): Promise<DataSource> {
        try {
            // For hackathon: simplified implementation
            // In production, this would call SportsData.io API
            console.log('SportsData API call (placeholder):', query);

            return {
                name: 'SportsData',
                data: 'Sports data placeholder - implement based on market type',
                confidence: 0.7,
                timestamp: Date.now(),
            };
        } catch (error) {
            console.error('Error fetching SportsData:', error);
            return {
                name: 'SportsData',
                data: 'Error fetching sports data',
                confidence: 0,
                timestamp: Date.now(),
            };
        }
    }

    /**
     * Aggregate data from multiple sources
     */
    async aggregateData(question: string): Promise<DataSource[]> {
        const sources: DataSource[] = [];

        // Fetch from all available sources
        const newsData = await this.fetchNewsAPI(question);
        sources.push(newsData);

        // Add more sources as needed
        // const sportsData = await this.fetchSportsData(question);
        // sources.push(sportsData);

        return sources.filter(source => source.confidence > 0);
    }
}

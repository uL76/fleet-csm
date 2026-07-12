<?php

namespace App\Services\Accurate;

use Carbon\Carbon;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AccurateClient
{
    private string $baseUrl;

    private string $token;

    private string $signatureSecret;

    private string $timezone;

    private int $timeout;

    private int $connectTimeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(
            (string) config(
                'services.accurate.base_url'
            ),
            '/'
        );

        $this->token = (string) config(
            'services.accurate.token'
        );

        $this->signatureSecret = (string) config(
            'services.accurate.signature_secret'
        );

        $this->timezone = (string) config(
            'services.accurate.timezone',
            'Asia/Jakarta'
        );

        $this->timeout = (int) config(
            'services.accurate.timeout',
            90
        );

        $this->connectTimeout = (int) config(
            'services.accurate.connect_timeout',
            20
        );

        $this->validateConfiguration();
    }

    private function validateConfiguration(): void
    {
        if ($this->baseUrl === '') {
            throw new RuntimeException(
                'ACCURATE_BASE_URL belum diatur.'
            );
        }

        if ($this->token === '') {
            throw new RuntimeException(
                'ACCURATE_API_TOKEN belum diatur.'
            );
        }

        if ($this->signatureSecret === '') {
            throw new RuntimeException(
                'ACCURATE_SIGNATURE_SECRET belum diatur.'
            );
        }
    }

    private function timestamp(): string
    {
        return Carbon::now($this->timezone)
            ->format('d/m/Y H:i:s');
    }

    private function headers(): array
    {
        $timestamp = $this->timestamp();

        $signature = base64_encode(
            hash_hmac(
                'sha256',
                $timestamp,
                $this->signatureSecret,
                true
            )
        );

        return [
            'Authorization' => 'Bearer '.$this->token,
            'X-Api-Timestamp' => $timestamp,
            'X-Api-Signature' => $signature,
            'Accept' => 'application/json',
        ];
    }

    private function request(): PendingRequest
    {
        return Http::withHeaders(
            $this->headers()
        )
            ->connectTimeout(
                $this->connectTimeout
            )
            ->timeout(
                $this->timeout
            )
            ->retry(
                times: 2,
                sleepMilliseconds: 500,
                throw: false
            );
    }

    public function get(
        string $endpoint,
        array $query = []
    ): Response {
        $url = $this->baseUrl.'/'
            .ltrim($endpoint, '/');

        return $this->request()->get(
            $url,
            $query
        );
    }

    public function post(
        string $endpoint,
        array $payload = []
    ): Response {
        $url = $this->baseUrl.'/'
            .ltrim($endpoint, '/');

        return $this->request()
            ->asForm()
            ->post(
                $url,
                $payload
            );
    }
}

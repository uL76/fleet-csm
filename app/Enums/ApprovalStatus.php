<?php

namespace App\Enums;

enum ApprovalStatus: string
{
    case Pending = 'PENDING';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
    case Revision = 'REVISION';
    case Skipped = 'SKIPPED';
}

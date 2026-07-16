<?php

namespace App\Enums;

enum MaterialRequestStatus: string
{
    case Draft = 'DRAFT';

    case Submitted = 'SUBMITTED';

    case InReview = 'IN_REVIEW';

    case Reviewed = 'REVIEWED';

    case Approved = 'APPROVED';

    case Revision = 'REVISION';

    case Rejected = 'REJECTED';

    case Cancelled = 'CANCELLED';

    case Closed = 'CLOSED';
}

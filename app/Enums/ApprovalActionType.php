<?php

namespace App\Enums;

enum ApprovalActionType: string
{
    case Review = 'REVIEW';
    case Approve = 'APPROVE';
}
